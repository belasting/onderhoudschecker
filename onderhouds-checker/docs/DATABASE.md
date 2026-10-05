# Database schema — AutoOnderhoud SaaS

Volledig doordacht schema, bedoeld om **niet meer aan te hoeven passen** naarmate
de app groeit. Postgres via Supabase. Zie `supabase/migrations/0001_init_schema.sql`
voor de daadwerkelijke DDL (tabellen + RLS policies + seed data), dit doc is de
uitleg erbij.

## Kernprincipes

1. **Elke user-tabel heeft Row Level Security.** Niemand kan ooit bij data van
   een ander account, zelfs niet per ongeluk via een bug in de API-laag.
2. **Nooit hard-deleten wat historie/rapporten nodig hebben.** `cars.status`
   heeft een `verwijderd` state — een auto "verwijderen" verbergt hem, het
   sloopt nooit de onderhoudshistorie die er nog aan hangt.
3. **Foto's/bijlagen zijn altijd een aparte tabel, nooit één `foto_url` kolom.**
   Dit is het meest voorkomende "hadden we dit maar vooraf geregeld"-punt.
   `car_photos` en `maintenance_attachments` staan er daarom vanaf dag 1.
4. **Geld in centen (int), nooit float.** Voorkomt afrondingsellende.
5. **RDW-data wordt volledig gecached in `cars.rdw_data` (jsonb).** Je haalt 'm
   1x op bij toevoegen, en hebt daarna élk veld dat RDW teruggeeft beschikbaar
   — ook velden waar je nu nog geen losse kolom voor hebt gemaakt.
6. **Monetisatie zit al in het model voor Stripe live is.** `subscription_tiers`
   + `subscriptions` bepalen nu al wat gratis/premium mag — je hoeft alleen
   Stripe erop aan te sluiten, geen schema-wijziging nodig.

## Tabellen per domein

### Auth & profiel
- **profiles** — 1:1 met `auth.users`. Naam, telefoon, avatar, onboarding-status.
  Wordt automatisch aangemaakt via een trigger zodra iemand zich registreert
  (`handle_new_user()`), samen met een lege `notification_preferences` rij.
- **notification_preferences** — hoe/wanneer wil deze user gewaarschuwd worden
  (email/push/sms aan-uit, hoeveel dagen van tevoren — array, dus meerdere
  reminders per item is mogelijk: bv. 30/14/7/1 dagen).

### Auto's (de garage van de gebruiker)
- **cars** — kenteken, RDW-data (cached als jsonb + losse kolommen voor wat je
  vaak filtert/toont: merk, model, bouwjaar, APK-datum), huidige kilometerstand,
  status (actief/verkocht/verwijderd = soft delete).
- **car_photos** — meerdere foto's per auto, met een `is_primary` vlag voor de
  hoofdfoto en `sort_order` voor de volgorde. Voorkomt dat je later moet
  migreren van "1 foto" naar "fotogalerij".
- **mileage_logs** — elke km-stand update wordt gelogd (niet overschreven).
  Nodig om onderhoudsintervallen te berekenen op basis van je echte rijgedrag,
  en later leuk voor een "km per jaar"-grafiekje.

### Onderhoud
- **maintenance_types** — de lijst onderhoudstypes (olie, APK, banden, etc.).
  12 standaardtypes zijn geseed. `is_systeem = false` + `user_id` ingevuld =
  een custom type dat een gebruiker zelf toevoegde (niet elke auto is hetzelfde).
- **maintenance_records** — de historie: wat is er wanneer gedaan, bij welke
  km-stand, wat heeft het gekost, door wie (zelf/garage/dealer).
- **maintenance_attachments** — bonnetjes/foto's/PDF's bij een onderhoudsbeurt,
  los van de record zodat er meerdere per beurt kunnen (voor- en achterkant
  bonnetje, foto van het onderdeel, etc.).
- **maintenance_schedule** — "wat moet wanneer" per auto per type, met een
  berekende `status` (ok/binnenkort/verlopen). Dit is een **afgeleide** tabel:
  een scheduled function (cron/Edge Function) herberekent 'm op basis van
  `maintenance_records` + `mileage_logs` + de intervallen uit
  `maintenance_types`. Niet live query-en bij elke pageload — dat schaalt niet
  en maakt notificaties lastig te triggeren.

### Notificaties (de core value prop van de app)
- **notifications** — elke melding die de gebruiker kreeg/krijgt: type
  (apk_verloopt / onderhoud_nodig / onderhoud_overdue), kanaal (email/in-app/
  sms/push — sms/push nu al in het model, ook al bouw je die nog niet), gelezen
  status. Dit is meteen ook je "notificatiecentrum" in de UI.

### Rapporten (premium, verkoopbaar)
- **reports** — gegenereerde PDF's (onderhoudshistorie, kosten-overzicht,
  verkoop-rapport). `car_id` mag `null` zijn voor een rapport over alle auto's
  samen (bv. jaarlijks kosten-overzicht).

### Garages (fase 2, tabellen liggen er al)
- **garages**, **garage_car_links**, **garage_reviews** — een garage kan zich
  registreren, gekoppeld worden aan een auto, en reviews krijgen. Tweede
  revenue stream later (garages betalen voor leads).

### Monetisatie
- **subscription_tiers** — free/premium/business met limieten (max auto's,
  wel/geen rapporten, wel/geen garage-koppeling, prijzen). Wijzig je hier één
  rij, geen deploy nodig.
- **subscriptions** — koppelt een user aan een tier + Stripe IDs + status.

## Bewust NIET gebouwd (en waarom)

- **Losse `invoices`/betalingshistorie-tabel** — Stripe is hier al de bron van
  waarheid (Stripe Customer Portal toont facturen). Dupliceren = twee bronnen
  die kunnen desyncen. Als je ooit facturen in-app wil tonen, haal je ze live
  op via de Stripe API, geen eigen tabel nodig.
- **Audit/activity log** — leuk voor later ("wie wijzigde wat wanneer"), maar
  voor een MVP met alleen consumenten-accounts (geen teams) voegt het nu geen
  waarde toe. Makkelijk toe te voegen zonder iets te breken zodra je teams/
  meerdere users per account krijgt.

## Supabase Storage buckets (naast de database)

| Bucket | Inhoud | Toegang |
|---|---|---|
| `avatars` | Profielfoto's | public-read, write = eigenaar |
| `car-photos` | Auto-foto's (`car_photos.storage_path`) | public-read, write via car-ownership |
| `maintenance-attachments` | Bonnetjes/foto's bij onderhoud | private, alleen eigenaar |
| `reports` | Gegenereerde PDF-rapporten | private, alleen eigenaar |

## Volgende stappen

1. Migratie draaien in Supabase (`supabase db push` of via dashboard SQL editor).
2. Storage buckets aanmaken met bovenstaande policies.
3. `maintenance_schedule` vullen via een Supabase Edge Function op een cron
   (dagelijks), die ook meteen de `notifications`-rijen aanmaakt.
4. RDW-sync functie: bij toevoegen auto op kenteken → RDW open data API →
   wegschrijven in `cars.rdw_data` + de losse kolommen.

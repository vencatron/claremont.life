create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  college text not null default 'All',
  event_type text,
  location text,
  starts_at timestamptz not null,
  url text,
  created_at timestamptz default now()
);

create table businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  deal_description text not null,
  address text,
  website text,
  is_active boolean default true
);

create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  subscribed_at timestamptz default now()
);

alter table events enable row level security;
alter table businesses enable row level security;
alter table newsletter_subscribers enable row level security;

create policy "Public read events" on events for select using (true);
create policy "Public read businesses" on businesses for select using (true);
create policy "Anyone can subscribe" on newsletter_subscribers for insert with check (true);

insert into events (title, college, event_type, location, starts_at) values
('Joint 5C Study Break', 'All', 'Social', 'Frary Dining Hall', now() + interval '2 days'),
('CMC Athenaeum Lecture', 'CMC', 'Academic', 'Athenaeum', now() + interval '3 days'),
('Scripps Art Opening', 'Scripps', 'Arts', 'Williamson Gallery', now() + interval '5 days'),
('Mudd Tech Talk', 'Harvey Mudd', 'Academic', 'Shanahan Center', now() + interval '7 days'),
('Claremont Village Farmers Market', 'All', 'Community', 'Claremont Village', now() + interval '4 days'),
('Pitzer Sustainability Fair', 'Pitzer', 'Community', 'Pitzer Campus', now() + interval '6 days'),
('CGU Research Symposium', 'CGU', 'Academic', 'CGU Campus', now() + interval '8 days');

insert into businesses (name, category, deal_description, address) values
('Zing! Cafe', 'Coffee', '15% off any drink with student ID', '118 Yale Ave'),
('Basecamp Coffee', 'Coffee', '20% off for 5C students all day', '239 Yale Ave'),
('The Press Restaurant', 'Food', 'Student happy hour 3-5pm daily', 'Claremont Village'),
('KazuNori', 'Food', 'Hand-roll sushi — fast, affordable, outstanding', 'Claremont Village'),
('Village Pizzeria', 'Food', 'Free garlic bread with any student order', 'Claremont Village'),
('The Back Abbey', 'Bar', '21+. Best beer selection in the 909', '412 Yale Ave'),
('Claremont Club', 'Fitness', 'Student membership $30/mo (reg. $75)', '840 S Indian Hill Blvd'),
('Rhino Records Cafe', 'Entertainment', 'Buy a record, get a free drip coffee', '134 Yale Ave');

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Courses table
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  exam_date date not null,
  created_at timestamptz default now()
);

-- Documents table
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses on delete cascade not null,
  name text not null,
  content text not null,
  type text not null check (type in ('pdf', 'image', 'text')),
  created_at timestamptz default now()
);

-- Topics table
create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses on delete cascade not null,
  name text not null,
  description text,
  mastery_score integer default 0 check (mastery_score >= 0 and mastery_score <= 100),
  created_at timestamptz default now()
);

-- Questions table
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references topics on delete cascade not null,
  question text not null,
  correct_answer text not null,
  difficulty text default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  next_review_at timestamptz default now(),
  times_seen integer default 0,
  times_correct integer default 0,
  created_at timestamptz default now()
);

-- Answers table
create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions on delete cascade not null,
  user_id uuid references auth.users not null,
  answer_text text not null,
  is_voice boolean default false,
  score integer not null check (score >= 0 and score <= 100),
  feedback text not null,
  weak_spots text[] default '{}',
  created_at timestamptz default now()
);

-- Study plans table
create table if not exists study_plans (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses on delete cascade not null,
  plan_json jsonb not null default '[]',
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table courses enable row level security;
alter table documents enable row level security;
alter table topics enable row level security;
alter table questions enable row level security;
alter table answers enable row level security;
alter table study_plans enable row level security;

-- RLS Policies: courses
create policy "Users can read own courses"
  on courses for select using (auth.uid() = user_id);
create policy "Users can insert own courses"
  on courses for insert with check (auth.uid() = user_id);
create policy "Users can update own courses"
  on courses for update using (auth.uid() = user_id);
create policy "Users can delete own courses"
  on courses for delete using (auth.uid() = user_id);

-- RLS Policies: documents (via course ownership)
create policy "Users can read own documents"
  on documents for select using (
    exists (select 1 from courses where courses.id = documents.course_id and courses.user_id = auth.uid())
  );
create policy "Users can insert own documents"
  on documents for insert with check (
    exists (select 1 from courses where courses.id = documents.course_id and courses.user_id = auth.uid())
  );
create policy "Users can delete own documents"
  on documents for delete using (
    exists (select 1 from courses where courses.id = documents.course_id and courses.user_id = auth.uid())
  );

-- RLS Policies: topics (via course ownership)
create policy "Users can read own topics"
  on topics for select using (
    exists (select 1 from courses where courses.id = topics.course_id and courses.user_id = auth.uid())
  );
create policy "Users can insert own topics"
  on topics for insert with check (
    exists (select 1 from courses where courses.id = topics.course_id and courses.user_id = auth.uid())
  );
create policy "Users can update own topics"
  on topics for update using (
    exists (select 1 from courses where courses.id = topics.course_id and courses.user_id = auth.uid())
  );
create policy "Users can delete own topics"
  on topics for delete using (
    exists (select 1 from courses where courses.id = topics.course_id and courses.user_id = auth.uid())
  );

-- RLS Policies: questions (via topic -> course ownership)
create policy "Users can read own questions"
  on questions for select using (
    exists (
      select 1 from topics
      join courses on courses.id = topics.course_id
      where topics.id = questions.topic_id and courses.user_id = auth.uid()
    )
  );
create policy "Users can insert own questions"
  on questions for insert with check (
    exists (
      select 1 from topics
      join courses on courses.id = topics.course_id
      where topics.id = questions.topic_id and courses.user_id = auth.uid()
    )
  );
create policy "Users can update own questions"
  on questions for update using (
    exists (
      select 1 from topics
      join courses on courses.id = topics.course_id
      where topics.id = questions.topic_id and courses.user_id = auth.uid()
    )
  );

-- RLS Policies: answers
create policy "Users can read own answers"
  on answers for select using (auth.uid() = user_id);
create policy "Users can insert own answers"
  on answers for insert with check (auth.uid() = user_id);

-- RLS Policies: study_plans (via course ownership)
create policy "Users can read own study plans"
  on study_plans for select using (
    exists (select 1 from courses where courses.id = study_plans.course_id and courses.user_id = auth.uid())
  );
create policy "Users can insert own study plans"
  on study_plans for insert with check (
    exists (select 1 from courses where courses.id = study_plans.course_id and courses.user_id = auth.uid())
  );
create policy "Users can update own study plans"
  on study_plans for update using (
    exists (select 1 from courses where courses.id = study_plans.course_id and courses.user_id = auth.uid())
  );

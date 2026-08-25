-- Add skipped flag per dose to student_immunizations
alter table student_immunizations add column if not exists skipped bool not null default false;

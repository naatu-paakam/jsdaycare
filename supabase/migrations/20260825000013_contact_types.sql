-- Expand contact type options beyond parent/guardian
alter table student_contacts drop constraint if exists student_contacts_type_check;
alter table student_contacts add constraint student_contacts_type_check
  check (type in ('parent','guardian','grandparent','aunt_uncle','babysitter','nanny','family_friend','other'));

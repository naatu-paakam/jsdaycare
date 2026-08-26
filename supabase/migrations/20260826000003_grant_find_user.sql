-- Grant execute on find_user_id_by_email to authenticated users
grant execute on function find_user_id_by_email(text) to authenticated;

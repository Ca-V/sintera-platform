create policy exams_delete on public.exams
  for delete to public
  using ((select auth.uid()) = user_id);
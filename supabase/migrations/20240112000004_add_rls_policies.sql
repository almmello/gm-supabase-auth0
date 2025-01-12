-- Política para SELECT: permite usuários lerem apenas seus próprios todos
CREATE POLICY "users can select their own todos" ON public.todos
    FOR SELECT
    USING (auth.user_id() = user_id);

-- Política para INSERT: permite usuários criarem todos apenas para si mesmos
CREATE POLICY "users can insert their own todos" ON public.todos
    FOR INSERT
    WITH CHECK (auth.user_id() = user_id);
-- Execute este SQL no SQL Editor do Supabase
-- Vá em: Supabase > SQL Editor > New Query > Cole este código > Run

-- Policy para permitir upload de avatares
CREATE POLICY "avatars_upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Policy para permitir leitura pública de avatares
CREATE POLICY "avatars_public_read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy para permitir atualização de avatares
CREATE POLICY "avatars_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- Policy para permitir deletar avatares
CREATE POLICY "avatars_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

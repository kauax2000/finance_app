-- Criar bucket para avatares no Supabase Storage
-- Execute este SQL no painel do Supabase (Storage > New bucket)

-- Nome do bucket: avatars
-- ID público: avatars
-- Configurações:
--   - Public bucket: true (para permitir acesso público às imagens)
--   - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
--   - Max file size: 5MB

-- Após criar o bucket, a URL pública será algo como:
-- https://[seu-projeto].supabase.co/storage/v1/object/public/avatars/[user-id]/[filename]

-- Policy para permitir upload de avatares pelo próprio usuário:
/*
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (auth.uid()::text = (storage.foldername(name))[1])
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (auth.uid()::text = (storage.foldername(name))[1])
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (auth.uid()::text = (storage.foldername(name))[1])
);

CREATE POLICY "Users can read avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (auth.uid()::text = (storage.foldername(name))[1])
);
*/

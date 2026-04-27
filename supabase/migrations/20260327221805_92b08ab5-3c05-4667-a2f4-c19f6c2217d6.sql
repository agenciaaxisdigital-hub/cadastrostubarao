INSERT INTO sindspag_usuarios (nome, senha_hash, cargo)
VALUES ('Deocleciano', crypt('Sarelli2020', gen_salt('bf')), 'admin');
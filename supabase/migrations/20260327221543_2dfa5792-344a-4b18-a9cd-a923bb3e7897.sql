INSERT INTO sindspag_usuarios (nome, senha_hash, cargo)
VALUES ('Administrador', crypt('Sarelli123@', gen_salt('bf')), 'admin');
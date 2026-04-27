
CREATE OR REPLACE FUNCTION public.sindspag_criar_usuario(p_nome text, p_senha text, p_cargo text DEFAULT 'usuario'::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  INSERT INTO sindspag_usuarios (nome, senha_hash, cargo)
  VALUES (p_nome, crypt(p_senha, gen_salt('bf')), p_cargo);
  RETURN json_build_object('success', true);
EXCEPTION WHEN unique_violation THEN
  RETURN json_build_object('success', false, 'message', 'Usuário já existe');
END;
$function$;

CREATE OR REPLACE FUNCTION public.sindspag_login(p_nome text, p_senha text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_user sindspag_usuarios;
BEGIN
  SELECT * INTO v_user FROM sindspag_usuarios WHERE nome = p_nome;
  IF v_user.id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Usuário não encontrado');
  END IF;
  IF v_user.senha_hash = crypt(p_senha, v_user.senha_hash) THEN
    RETURN json_build_object('success', true, 'user_id', v_user.id, 'nome', v_user.nome, 'cargo', v_user.cargo);
  ELSE
    RETURN json_build_object('success', false, 'message', 'Senha incorreta');
  END IF;
END;
$function$;

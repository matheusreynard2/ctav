import { useState } from 'react';
import { authService } from '../api';
import Logo from './Logo.jsx';

export default function Login({ onAutenticado }) {
  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [entrando, setEntrando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    if (!username.trim() || !senha) {
      setErro('Informe usuário e senha.');
      return;
    }
    setEntrando(true);
    try {
      const usuario = await authService.login(username.trim(), senha);
      onAutenticado(usuario);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        'Não foi possível entrar. Verifique suas credenciais.';
      setErro(msg);
    } finally {
      setEntrando(false);
    }
  };

  return (
    <div className="login-tela">
      <form className="card login-card" onSubmit={handleSubmit}>
        <div className="login-logo" aria-hidden="true">
          <Logo className="login-logo-img" />
        </div>

        <p className="login-subtitulo">Acesse o sistema com suas credenciais.</p>

        <div className="campo">
          <label htmlFor="login-username">Usuário</label>
          <input
            id="login-username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Seu usuário"
            autoComplete="username"
            autoFocus
          />
        </div>

        <div className="campo">
          <label htmlFor="login-senha">Senha</label>
          <div className="login-senha-wrapper">
            <input
              id="login-senha"
              name="senha"
              type={mostrarSenha ? 'text' : 'password'}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Sua senha"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="login-senha-toggle"
              onClick={() => setMostrarSenha((v) => !v)}
              aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {mostrarSenha ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>

        {erro && <div className="alerta alerta-erro login-erro">{erro}</div>}

        <button
          type="submit"
          className="btn btn-primario login-btn"
          disabled={entrando}
        >
          {entrando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const fn = isLogin ? signIn : signUp;
    const result = await fn(email, password);
    if (result?.error) setError(result.error.message);
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-8 w-full max-w-sm">
        <h2 className="text-xl font-bold mb-6 text-center">
          {isLogin ? "Connexion" : "Inscription"}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="px-4 py-3 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-sm outline-none focus:border-indigo-500" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" className="px-4 py-3 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-sm outline-none focus:border-indigo-500" required />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button className="bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-lg font-medium transition-colors">
            {isLogin ? "Se connecter" : "Creer un compte"}
          </button>
        </form>
        <button onClick={() => signInWithGoogle()} className="w-full mt-3 bg-[#1e1e1e] border border-[#2a2a2a] hover:border-indigo-500 text-sm py-3 rounded-lg transition-colors">
          Continuer avec Google
        </button>
        <p className="text-center text-sm text-gray-500 mt-4">
          {isLogin ? "Pas de compte ?" : "Deja un compte ?"}
          <button onClick={() => setIsLogin(!isLogin)} className="text-indigo-400 ml-1 hover:underline">
            {isLogin ? "Inscription" : "Connexion"}
          </button>
        </p>
      </div>
    </div>
  );
}

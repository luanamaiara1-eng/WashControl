import { Link } from "react-router-dom";
import logoImage from "@/assets/logo.png";

export const Footer = () => {
  return (
    <footer id="contato" className="py-16 bg-sidebar text-sidebar-foreground">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img 
                src={logoImage} 
                alt="WashControl Logo" 
                className="w-10 h-10 rounded-xl object-cover"
              />
              <span className="text-xl font-bold">
                Wash<span className="text-primary">Control</span>
              </span>
            </Link>
            <p className="text-sidebar-foreground/70 max-w-md mb-4">
              O aplicativo profissional para gestão de lava-rápidos, lava-jatos e estética automotiva. 
              Tenha controle total do seu negócio.
            </p>
            <p className="text-sm text-primary font-medium mb-6">
              Não é planilha. É um aplicativo profissional.
            </p>
            <p className="text-sm text-sidebar-foreground/50">
              © 2024 WashControl Pro. Todos os direitos reservados.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Produto</h4>
            <ul className="space-y-3">
              <li>
                <a href="#recursos" className="text-sidebar-foreground/70 hover:text-primary transition-colors">
                  Funcionalidades
                </a>
              </li>
              <li>
                <a href="#precos" className="text-sidebar-foreground/70 hover:text-primary transition-colors">
                  Preços
                </a>
              </li>
              <li>
                <Link to="/registro" className="text-sidebar-foreground/70 hover:text-primary transition-colors">
                  Teste Grátis
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-sidebar-foreground/70 hover:text-primary transition-colors">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contato</h4>
            <ul className="space-y-3">
              <li className="text-sidebar-foreground/70">
                suporte@washcontrol.com.br
              </li>
              <li className="text-sidebar-foreground/70">
                (11) 99999-9999
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Carlos Silva",
    business: "Auto Brilho Estética",
    location: "São Paulo, SP",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    text: "Antes usava planilha e vivia perdendo agendamento. Agora tenho controle total. Meus funcionários têm acesso limitado e eu acompanho tudo pelo celular. Melhor investimento que fiz!"
  },
  {
    name: "Fernanda Oliveira",
    business: "Lava Jato Premium",
    location: "Curitiba, PR",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    text: "O agendamento online mudou meu negócio. Clientes agendam sozinhos pelo link e eu não perco mais tempo no WhatsApp. O controle financeiro é sensacional!"
  },
  {
    name: "Roberto Mendes",
    business: "Detail Car Center",
    location: "Belo Horizonte, MG",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    text: "A nota em PDF personalizada com minha logo passou uma imagem muito mais profissional. Clientes elogiam e voltam sempre. Recomendo demais!"
  },
  {
    name: "Ana Paula Costa",
    business: "Estética Automotiva Elite",
    location: "Rio de Janeiro, RJ",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    text: "Finalmente consigo ver o lucro real do meu negócio. O relatório de comissões por funcionário me deu visibilidade que nunca tive. Sistema completo e fácil de usar."
  },
  {
    name: "Marcos Ribeiro",
    business: "Lava Rápido Express",
    location: "Porto Alegre, RS",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    text: "Testei vários sistemas antes e nenhum era específico para lava-rápido. O WashControl entende nossa realidade. Check-in, check-out, histórico de veículos... tudo que preciso!"
  },
  {
    name: "Juliana Santos",
    business: "Clean Car Detailing",
    location: "Brasília, DF",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    text: "A segurança dos dados me conquistou. Cada funcionário tem seu login e vê apenas o que precisa. Ninguém mais tem acesso ao meu financeiro. Paz de espírito total!"
  }
];

export const TestimonialsSection = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            Depoimentos
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Quem usa, <span className="text-primary">recomenda</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Mais de 500 lava-rápidos e estéticas automotivas já transformaram sua gestão com o WashControl
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-card rounded-2xl p-6 shadow-lg border border-border/50 hover:shadow-xl hover:border-primary/30 transition-all duration-300 group"
            >
              {/* Quote Icon */}
              <div className="mb-4">
                <Quote className="w-8 h-8 text-primary/30 group-hover:text-primary/50 transition-colors" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Text */}
              <p className="text-muted-foreground mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4 pt-4 border-t border-border/50">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20"
                />
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.business}</p>
                  <p className="text-xs text-muted-foreground/70">{testimonial.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust indicators */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-8 flex-wrap justify-center">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {testimonials.slice(0, 4).map((t, i) => (
                  <img
                    key={i}
                    src={t.image}
                    alt=""
                    className="w-8 h-8 rounded-full border-2 border-background object-cover"
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">+500 empresas</span>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="text-sm text-muted-foreground ml-1">4.9/5 de avaliação</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

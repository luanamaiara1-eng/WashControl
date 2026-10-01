import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "Preciso ter conhecimento técnico para usar o WashControl?",
    answer: "Não! O WashControl foi desenvolvido pensando em donos de lava-jatos que não têm tempo para aprender sistemas complicados. A interface é intuitiva e você consegue dominar todas as funções em poucos minutos. Além disso, oferecemos suporte completo para ajudá-lo em qualquer dúvida."
  },
  {
    question: "Posso acessar o sistema de qualquer lugar?",
    answer: "Sim! O WashControl funciona 100% na nuvem, o que significa que você pode acessar de qualquer dispositivo com internet - seja computador, tablet ou celular. Acompanhe seu negócio de casa, da praia ou de qualquer lugar do mundo."
  },
  {
    question: "Como funciona o agendamento online para clientes?",
    answer: "Você recebe uma página exclusiva de agendamento que pode compartilhar com seus clientes. Eles escolhem o serviço, data e horário disponíveis, e o agendamento aparece automaticamente no seu painel. Você pode aprovar, reagendar ou cancelar com facilidade."
  },
  {
    question: "Meus dados estão seguros?",
    answer: "Absolutamente! Utilizamos criptografia de nível bancário e servidores seguros para proteger todas as informações do seu negócio. Fazemos backups automáticos diários para garantir que você nunca perca nenhum dado importante."
  },
  {
    question: "Posso cadastrar vários funcionários?",
    answer: "Sim! Você pode cadastrar quantos funcionários precisar. Cada um recebe um código de acesso próprio e você consegue acompanhar a produtividade, comissões e serviços realizados por cada um separadamente."
  },
  {
    question: "O sistema gera notas de serviço?",
    answer: "Sim! Ao finalizar cada atendimento, você pode gerar uma nota de serviço profissional com todos os detalhes: dados do cliente, veículo, serviços realizados e valores. Pode enviar por WhatsApp ou imprimir."
  },
  {
    question: "Existe período de teste gratuito?",
    answer: "Sim! Oferecemos um período de teste gratuito para você experimentar todas as funcionalidades do WashControl sem compromisso. Assim você pode ver na prática como o sistema vai transformar a gestão do seu lava-jato."
  },
  {
    question: "Posso cancelar a qualquer momento?",
    answer: "Claro! Não temos fidelidade ou multa por cancelamento. Você pode cancelar sua assinatura a qualquer momento diretamente pelo sistema. Mas temos certeza de que depois de experimentar, você não vai querer voltar ao papel e caneta!"
  }
];

export const FAQSection = () => {
  return (
    <section id="faq" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <HelpCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Tire suas dúvidas</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Perguntas Frequentes
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Encontre respostas para as dúvidas mais comuns sobre o WashControl
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-background border border-border rounded-xl px-6 data-[state=open]:shadow-lg transition-shadow"
              >
                <AccordionTrigger className="text-left text-base md:text-lg font-medium hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Ainda tem dúvidas?{" "}
            <a
              href="#contato"
              className="text-primary font-medium hover:underline"
            >
              Entre em contato conosco
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

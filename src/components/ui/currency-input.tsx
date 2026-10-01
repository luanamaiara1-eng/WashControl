import * as React from "react";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const formatCurrency = (val: string): string => {
      // Remove tudo que não é número
      const numbers = val.replace(/\D/g, "");
      
      if (!numbers) return "";
      
      // Converte para número com 2 casas decimais
      const amount = parseInt(numbers, 10) / 100;
      
      // Formata no padrão brasileiro
      return amount.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const formatted = formatCurrency(rawValue);
      onChange(formatted);
    };

    // Converte valor formatado para número (para envio ao backend)
    const getNumericValue = (formatted: string): number => {
      if (!formatted) return 0;
      // Remove pontos de milhar e troca vírgula por ponto
      const normalized = formatted.replace(/\./g, "").replace(",", ".");
      return parseFloat(normalized) || 0;
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          R$
        </span>
        <input
          type="text"
          inputMode="numeric"
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 pl-10 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className
          )}
          ref={ref}
          value={value}
          onChange={handleChange}
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

// Helper para converter valor formatado para número
export const parseCurrencyToNumber = (formatted: string): number => {
  if (!formatted) return 0;
  const normalized = formatted.replace(/\./g, "").replace(",", ".");
  return parseFloat(normalized) || 0;
};

// Helper para converter número para formato brasileiro
export const formatNumberToCurrency = (value: number): string => {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export { CurrencyInput };

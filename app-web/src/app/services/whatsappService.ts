import { CartItem, OrderFormData } from '../types/catalog';

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatPhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

const buildOrderMessage = (customer: OrderFormData, items: CartItem[], total: number): string => {
  const header = `*Novo Pedido*\n\n`;
  const customerInfo = `*Cliente:* ${customer.customerName}\n*WhatsApp:* ${customer.whatsapp}\n*Endereço:* ${customer.address}\n\n`;
  const itemsHeader = `*Itens do Pedido:*\n`;
  const itemsList = items
    .map((item) => {
      const price =
        item.product.discount > 0
          ? item.product.salePrice * (1 - item.product.discount / 100)
          : item.product.salePrice;
      const subtotal = price * item.quantity;
      return `- ${item.quantity}x ${item.product.name} (${formatCurrency(price)}) = ${formatCurrency(subtotal)}`;
    })
    .join('\n');
  const totalLine = `\n\n*Total:* ${formatCurrency(total)}`;
  return encodeURIComponent(header + customerInfo + itemsHeader + itemsList + totalLine);
};

export const whatsappService = {
  generateOrderLink: (
    companyWhatsapp: string,
    customer: OrderFormData,
    items: CartItem[],
    total: number,
  ): string => {
    const phone = formatPhoneNumber(companyWhatsapp);
    const message = buildOrderMessage(customer, items, total);
    return `https://wa.me/55${phone}?text=${message}`;
  },

  sendOrder: (
    companyWhatsapp: string,
    customer: OrderFormData,
    items: CartItem[],
    total: number,
  ): void => {
    const link = whatsappService.generateOrderLink(companyWhatsapp, customer, items, total);
    window.open(link, '_blank');
  },
};

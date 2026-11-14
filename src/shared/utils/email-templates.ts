/**
 * Transactional order email templates.
 *
 * All markup is table-based with inline styles for maximum compatibility
 * across email clients (Gmail, Outlook, Apple Mail, etc.).
 */

const COLORS = {
  pageBg: '#f5f3ee',
  card: '#ffffff',
  dark: '#0c0c10',
  darkSoft: '#17171d',
  accent: '#c9a959',
  text: '#1a1a1f',
  muted: '#6b6b76',
  faint: '#8a8a94',
  border: '#ece7dc',
  panel: '#faf8f4',
};

const FONT_BODY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const FONT_DISPLAY = "Georgia, 'Times New Roman', serif";

export interface EmailOrderItem {
  title: string;
  quantity: number;
  price: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface OrderEmailData {
  orderId: string;
  orderDate: Date | string;
  status: string;
  customer: { name: string; email?: string; phone?: string };
  delivery: { name: string; phone: string; address: string };
  items: EmailOrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
}

interface StatusMeta {
  label: string;
  color: string;
  bg: string;
  message: string;
}

const STATUS_META: Record<string, StatusMeta> = {
  pending: {
    label: 'Pending',
    color: '#b45309',
    bg: '#fef3c7',
    message: 'We have received your order and it is awaiting confirmation.',
  },
  confirmed: {
    label: 'Confirmed',
    color: '#15803d',
    bg: '#dcfce7',
    message: 'Your payment has been confirmed and your order is being prepared.',
  },
  processing: {
    label: 'Processing',
    color: '#1d4ed8',
    bg: '#dbeafe',
    message: 'We are preparing your order for shipment.',
  },
  shipped: {
    label: 'Shipped',
    color: '#6d28d9',
    bg: '#ede9fe',
    message: 'Your order is on its way.',
  },
  delivered: {
    label: 'Delivered',
    color: '#047857',
    bg: '#d1fae5',
    message: 'Your order has been delivered. We hope you love it.',
  },
  completed: {
    label: 'Completed',
    color: '#15803d',
    bg: '#dcfce7',
    message: 'Your order is complete. Thank you for shopping with Vendora.',
  },
  cancelled: {
    label: 'Cancelled',
    color: '#b91c1c',
    bg: '#fee2e2',
    message:
      'Your order has been cancelled. If this was not expected, please contact our support team.',
  },
};

function statusMeta(status: string): StatusMeta {
  return (
    STATUS_META[status] ?? {
      label: status.charAt(0).toUpperCase() + status.slice(1),
      color: COLORS.muted,
      bg: '#f3f3f4',
      message: 'Your order status has been updated.',
    }
  );
}

function escapeHtml(value: string | number | undefined | null): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatCurrency(amount: number): string {
  return `Rs. ${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)}`;
}

function formatDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function renderShell(options: {
  preheader: string;
  headerLabel: string;
  heading: string;
  intro: string;
  content: string;
  cta?: { label: string; url: string };
  footerNote?: string;
}): string {
  const { preheader, headerLabel, heading, intro, content, cta, footerNote } =
    options;

  const ctaBlock = cta
    ? `
              <tr>
                <td style="padding:8px 40px 4px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" bgcolor="${COLORS.dark}" style="border-radius:8px;">
                        <a href="${escapeHtml(cta.url)}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${FONT_BODY};font-size:14px;font-weight:600;letter-spacing:0.4px;color:#ffffff;text-decoration:none;border-radius:8px;">
                          ${escapeHtml(cta.label)}
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
  <title>${escapeHtml(options.heading)}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${COLORS.pageBg};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">
    ${escapeHtml(preheader)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLORS.pageBg}" style="background-color:${COLORS.pageBg};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:${COLORS.card};border-radius:16px;overflow:hidden;border:1px solid ${COLORS.border};">
          <!-- Header -->
          <tr>
            <td bgcolor="${COLORS.dark}" style="background-color:${COLORS.dark};padding:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="height:4px;background-color:${COLORS.accent};line-height:4px;font-size:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:26px 40px 24px;">
                    <div style="font-family:${FONT_DISPLAY};font-size:22px;font-weight:700;letter-spacing:5px;color:#ffffff;">
                      VENDORA<span style="color:${COLORS.accent};">.</span>
                    </div>
                    <div style="font-family:${FONT_BODY};font-size:11px;font-weight:600;letter-spacing:2.4px;color:rgba(255,255,255,0.45);margin-top:8px;text-transform:uppercase;">
                      ${escapeHtml(headerLabel)}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Hero -->
          <tr>
            <td style="padding:36px 40px 0;">
              <h1 style="margin:0;font-family:${FONT_DISPLAY};font-size:26px;line-height:1.3;font-weight:700;color:${COLORS.text};">
                ${escapeHtml(heading)}
              </h1>
              <p style="margin:12px 0 0;font-family:${FONT_BODY};font-size:15px;line-height:1.7;color:${COLORS.muted};">
                ${escapeHtml(intro)}
              </p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:28px 40px 8px;">
              ${content}
            </td>
          </tr>
          ${ctaBlock}
          <!-- Footer -->
          <tr>
            <td style="padding:28px 40px 34px;">
              <div style="border-top:1px solid ${COLORS.border};padding-top:22px;text-align:center;">
                <div style="font-family:${FONT_BODY};font-size:12px;font-weight:600;letter-spacing:1.6px;color:${COLORS.faint};text-transform:uppercase;">
                  Vendora &middot; Sri Lanka
                </div>
                <div style="font-family:${FONT_BODY};font-size:12px;line-height:1.7;color:${COLORS.faint};margin-top:8px;">
                  ${escapeHtml(footerNote || 'This email was sent automatically by Vendora. Please do not reply to this address.')}
                </div>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderStatusBadge(status: string): string {
  const meta = statusMeta(status);
  return `<span style="display:inline-block;padding:6px 12px;border-radius:999px;background-color:${meta.bg};color:${meta.color};font-family:${FONT_BODY};font-size:12px;font-weight:600;letter-spacing:0.3px;">${escapeHtml(meta.label)}</span>`;
}

function renderMetaBlock(data: OrderEmailData, showStatus: boolean): string {
  const cells: string[] = [
    `<td width="50%" style="padding:18px 20px;vertical-align:top;">
      <div style="font-family:${FONT_BODY};font-size:10px;font-weight:600;letter-spacing:1.4px;color:${COLORS.faint};text-transform:uppercase;">Order number</div>
      <div style="font-family:${FONT_BODY};font-size:14px;font-weight:600;color:${COLORS.text};margin-top:5px;">#${escapeHtml(data.orderId)}</div>
    </td>`,
    `<td width="50%" style="padding:18px 20px;vertical-align:top;border-left:1px solid ${COLORS.border};">
      <div style="font-family:${FONT_BODY};font-size:10px;font-weight:600;letter-spacing:1.4px;color:${COLORS.faint};text-transform:uppercase;">${showStatus ? 'Date' : 'Received'}</div>
      <div style="font-family:${FONT_BODY};font-size:14px;font-weight:600;color:${COLORS.text};margin-top:5px;">${escapeHtml(formatDate(data.orderDate))}</div>
    </td>`,
  ];

  if (showStatus) {
    cells.push(
      `<td width="50%" style="padding:18px 20px;vertical-align:top;border-left:1px solid ${COLORS.border};">
        <div style="font-family:${FONT_BODY};font-size:10px;font-weight:600;letter-spacing:1.4px;color:${COLORS.faint};text-transform:uppercase;">Status</div>
        <div style="margin-top:6px;">${renderStatusBadge(data.status)}</div>
      </td>`,
    );
  }

  const width = showStatus ? '33.33%' : '50%';
  const normalized = cells
    .join('')
    .replace(/width="50%"/g, `width="${width}"`);

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLORS.panel}" style="background-color:${COLORS.panel};border:1px solid ${COLORS.border};border-radius:12px;">
    <tr>${normalized}</tr>
  </table>`;
}

function sectionLabel(label: string): string {
  return `<div style="font-family:${FONT_BODY};font-size:11px;font-weight:700;letter-spacing:1.6px;color:${COLORS.faint};text-transform:uppercase;margin-bottom:10px;">${escapeHtml(label)}</div>`;
}

function renderItems(items: EmailOrderItem[]): string {
  if (!items.length) return '';

  const rows = items
    .map((item) => {
      const variant = [item.selectedColor, item.selectedSize]
        .filter(Boolean)
        .map((v) => escapeHtml(v))
        .join(' &middot; ');
      const lineTotal = item.price * item.quantity;

      return `<tr>
        <td style="padding:14px 0;border-bottom:1px solid ${COLORS.border};vertical-align:top;">
          <div style="font-family:${FONT_BODY};font-size:14px;font-weight:600;line-height:1.45;color:${COLORS.text};">${escapeHtml(item.title)}</div>
          ${variant ? `<div style="font-family:${FONT_BODY};font-size:12px;color:${COLORS.faint};margin-top:3px;">${variant}</div>` : ''}
          <div style="font-family:${FONT_BODY};font-size:12px;color:${COLORS.faint};margin-top:3px;">Qty ${item.quantity} &times; ${formatCurrency(item.price)}</div>
        </td>
        <td align="right" style="padding:14px 0;border-bottom:1px solid ${COLORS.border};vertical-align:top;font-family:${FONT_BODY};font-size:14px;font-weight:600;color:${COLORS.text};white-space:nowrap;">
          ${formatCurrency(lineTotal)}
        </td>
      </tr>`;
    })
    .join('');

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tbody>${rows}</tbody>
  </table>`;
}

function totalsRow(label: string, value: string, emphasis = false): string {
  return `<tr>
    <td style="padding:${emphasis ? '14px' : '7px'} 0 0;font-family:${FONT_BODY};font-size:${emphasis ? '15px' : '13px'};font-weight:${emphasis ? '700' : '400'};color:${emphasis ? COLORS.text : COLORS.muted};">${escapeHtml(label)}</td>
    <td align="right" style="padding:${emphasis ? '14px' : '7px'} 0 0;font-family:${FONT_BODY};font-size:${emphasis ? '18px' : '13px'};font-weight:${emphasis ? '700' : '500'};color:${emphasis ? COLORS.text : COLORS.muted};white-space:nowrap;">${escapeHtml(value)}</td>
  </tr>`;
}

function renderBuyerTotals(data: OrderEmailData): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;">
    ${totalsRow('Subtotal', formatCurrency(data.subtotal))}
    ${totalsRow('Shipping', data.shipping > 0 ? formatCurrency(data.shipping) : 'Free')}
    <tr>
      <td colspan="2" style="padding-top:10px;"><div style="border-top:1px solid ${COLORS.border};height:1px;line-height:1px;font-size:0;">&nbsp;</div></td>
    </tr>
    ${totalsRow('Order total', formatCurrency(data.total), true)}
  </table>`;
}

function renderDelivery(data: OrderEmailData): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLORS.panel}" style="background-color:${COLORS.panel};border:1px solid ${COLORS.border};border-radius:12px;">
    <tr>
      <td style="padding:18px 20px;">
        ${sectionLabel('Deliver to')}
        <div style="font-family:${FONT_BODY};font-size:14px;font-weight:600;color:${COLORS.text};line-height:1.5;">${escapeHtml(data.delivery.name)}</div>
        <div style="font-family:${FONT_BODY};font-size:13px;color:${COLORS.muted};line-height:1.7;margin-top:4px;">${escapeHtml(data.delivery.phone)}</div>
        <div style="font-family:${FONT_BODY};font-size:13px;color:${COLORS.muted};line-height:1.7;">${escapeHtml(data.delivery.address)}</div>
      </td>
    </tr>
  </table>`;
}

function renderCustomer(data: OrderEmailData): string {
  const lines = [
    `<div style="font-family:${FONT_BODY};font-size:14px;font-weight:600;color:${COLORS.text};line-height:1.5;">${escapeHtml(data.customer.name)}</div>`,
    data.customer.email
      ? `<div style="font-family:${FONT_BODY};font-size:13px;color:${COLORS.muted};line-height:1.7;margin-top:4px;">${escapeHtml(data.customer.email)}</div>`
      : '',
    data.customer.phone
      ? `<div style="font-family:${FONT_BODY};font-size:13px;color:${COLORS.muted};line-height:1.7;">${escapeHtml(data.customer.phone)}</div>`
      : '',
  ]
    .filter(Boolean)
    .join('');

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLORS.panel}" style="background-color:${COLORS.panel};border:1px solid ${COLORS.border};border-radius:12px;">
    <tr>
      <td style="padding:18px 20px;">
        ${sectionLabel('Customer')}
        ${lines}
      </td>
    </tr>
  </table>`;
}

function spacer(height = 24): string {
  return `<div style="height:${height}px;line-height:${height}px;font-size:0;">&nbsp;</div>`;
}

/**
 * Email sent to a vendor when an order includes their products.
 */
export function renderNewOrderVendorEmail(options: {
  data: OrderEmailData;
  vendorName?: string;
  dashboardUrl?: string;
}): { subject: string; htmlContent: string } {
  const { data, vendorName, dashboardUrl } = options;

  const vendorSubtotal = data.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const greeting = vendorName ? `Hi ${vendorName},` : 'Hello,';

  const content = `
    <p style="margin:0 0 24px;font-family:${FONT_BODY};font-size:15px;line-height:1.7;color:${COLORS.muted};">
      ${escapeHtml(greeting)} a new order <strong style="color:${COLORS.text};">#${escapeHtml(data.orderId)}</strong> includes one or more of your products. Please review the details below and prepare the item(s) for fulfilment.
    </p>
    ${renderMetaBlock(data, false)}
    ${spacer()}
    ${sectionLabel('Your items')}
    ${renderItems(data.items)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;">
      ${totalsRow('Your items total', formatCurrency(vendorSubtotal), true)}
    </table>
    ${spacer()}
    ${renderCustomer(data)}
    ${spacer(16)}
    ${renderDelivery(data)}
  `;

  return {
    subject: `New order #${data.orderId} received`,
    htmlContent: renderShell({
      preheader: `New order #${data.orderId} includes your products.`,
      headerLabel: 'New order notification',
      heading: 'You have a new order.',
      intro:
        'A customer has placed an order containing your products. Here is everything you need to fulfil it.',
      content,
      cta: dashboardUrl
        ? { label: 'Open vendor dashboard', url: dashboardUrl }
        : undefined,
      footerNote:
        'You are receiving this email because your products were purchased on Vendora.',
    }),
  };
}

/**
 * Email sent to a buyer whenever their order status changes.
 */
export function renderOrderStatusBuyerEmail(options: {
  data: OrderEmailData;
  appUrl?: string;
}): { subject: string; htmlContent: string } {
  const { data } = options;
  const meta = statusMeta(data.status);

  const content = `
    ${renderMetaBlock(data, true)}
    ${spacer()}
    <p style="margin:0 0 24px;font-family:${FONT_BODY};font-size:15px;line-height:1.7;color:${COLORS.muted};">
      ${escapeHtml(meta.message)}
    </p>
    ${sectionLabel('Order summary')}
    ${renderItems(data.items)}
    ${renderBuyerTotals(data)}
    ${spacer()}
    ${renderDelivery(data)}
  `;

  return {
    subject: `Order #${data.orderId} is ${meta.label.toLowerCase()}`,
    htmlContent: renderShell({
      preheader: `Your order #${data.orderId} is now ${meta.label.toLowerCase()}.`,
      headerLabel: 'Order status update',
      heading: `Your order is ${meta.label.toLowerCase()}.`,
      intro: `Hello ${data.customer.name}, here is the latest update on your Vendora order.`,
      content,
      footerNote:
        'You are receiving this email because you placed an order on Vendora.',
    }),
  };
}

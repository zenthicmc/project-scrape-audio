// eslint-disable-next-line @typescript-eslint/no-require-imports
const midtransClient = require("midtrans-client");

const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.MIDTRANS_CLIENT_KEY!,
});

export interface CreateTransactionParams {
  orderId: string;
  amount: number;
  credits: number;
  customerName: string;
  customerEmail: string;
}

export async function createSnapTransaction(params: CreateTransactionParams) {
  const { orderId, amount, credits, customerName, customerEmail } = params;

  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: amount,
    },
    item_details: [
      {
        id: `credits-${credits}`,
        price: amount,
        quantity: 1,
        name: `ScriptAI Top Up — ${credits} Credits`,
      },
    ],
    customer_details: {
      first_name: customerName,
      email: customerEmail,
    },
    callbacks: {
      finish: `${process.env.NEXTAUTH_URL}/dashboard/billing?payment=success`,
      error: `${process.env.NEXTAUTH_URL}/dashboard/billing?payment=error`,
      pending: `${process.env.NEXTAUTH_URL}/dashboard/billing?payment=pending`,
    },
  };

  const transaction = await snap.createTransaction(parameter);
  return transaction as { token: string; redirect_url: string };
}

export async function verifyMidtransNotification(notification: Record<string, string>) {
  return snap.transaction.notification(notification);
}

export { snap };

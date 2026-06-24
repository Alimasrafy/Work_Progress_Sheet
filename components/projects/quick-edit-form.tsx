"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";

type Props = {
  id: string;
  paymentStatus: string;
  withdrawStatus: string;
  withdrawnAmount: string;
  payPlatform: string;
  payoneerPaymentRequestId: string | null;
  invoice: string | null;
};

export function QuickEditForm(props: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [paymentStatus, setPaymentStatus] = useState(props.paymentStatus);
  const [withdrawStatus, setWithdrawStatus] = useState(props.withdrawStatus);
  const [withdrawnAmount, setWithdrawnAmount] = useState(props.withdrawnAmount);
  const [payPlatform, setPayPlatform] = useState(props.payPlatform);
  const [payoneerPaymentRequestId, setPayoneerPaymentRequestId] = useState(
    props.payoneerPaymentRequestId ?? ""
  );
  const [invoice, setInvoice] = useState(props.invoice ?? "");

  function onSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch(`/api/projects/${props.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          paymentStatus: formData.get("paymentStatus"),
          withdrawStatus: formData.get("withdrawStatus"),
          withdrawnAmount: Number(formData.get("withdrawnAmount")),
          payPlatform: formData.get("payPlatform"),
          payoneerPaymentRequestId: String(formData.get("payoneerPaymentRequestId") || "") || null,
          invoice: String(formData.get("invoice") || "") || null
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setMessage(payload?.message ?? "Save failed");
        return;
      }

      setMessage("Saved");
      router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="grid gap-3 rounded-lg border bg-card/82 p-4 shadow-soft backdrop-blur-xl md:grid-cols-2 xl:grid-cols-6">
      <Select
        name="paymentStatus"
        onChange={(event) => setPaymentStatus(event.target.value)}
        value={paymentStatus}
      >
        <option value="DONE">Done</option>
        <option value="PENDING">Pending</option>
      </Select>
      <Select
        name="withdrawStatus"
        onChange={(event) => setWithdrawStatus(event.target.value)}
        value={withdrawStatus}
      >
        <option value="WITHDRAWN">Withdrawn</option>
        <option value="NOT_WITHDRAWN">Not Withdrawn</option>
        <option value="PARTIAL">Partial</option>
      </Select>
      <Input
        name="withdrawnAmount"
        onChange={(event) => setWithdrawnAmount(event.target.value)}
        step="0.01"
        type="number"
        value={withdrawnAmount}
      />
      <Select
        name="payPlatform"
        onChange={(event) => setPayPlatform(event.target.value)}
        value={payPlatform}
      >
        <option value="PAYONEER">Payoneer</option>
        <option value="FIVERR">Fiverr</option>
        <option value="OTHER">Other</option>
      </Select>
      <Input
        name="payoneerPaymentRequestId"
        onChange={(event) => setPayoneerPaymentRequestId(event.target.value)}
        placeholder="Payoneer Request ID"
        value={payoneerPaymentRequestId}
      />
      <Input
        name="invoice"
        onChange={(event) => setInvoice(event.target.value)}
        placeholder="Invoice"
        value={invoice}
      />
      <div className="flex items-center gap-2 md:col-span-2 xl:col-span-6">
        <Button disabled={isPending} type="submit">
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </div>
    </form>
  );
}

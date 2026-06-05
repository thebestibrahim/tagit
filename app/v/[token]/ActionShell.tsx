"use client";

import { useState } from "react";
import TransferForm from "./TransferForm";
import CancelTransferForm from "./CancelTransferForm";

type OwnerInfo = {
  owner_name: string;
  owner_email: string;
  currency: string;
};

type TransferInfo = {
  id: string;
  to_name: string;
  to_email: string;
};

export default function ActionShell({
  tagId,
  hasPendingTransfer,
  currentOwner,
  activeTransfer,
  accent,
  primary,
}: {
  tagId: string;
  hasPendingTransfer: boolean;
  currentOwner: OwnerInfo | null;
  activeTransfer: TransferInfo | null;
  accent: string;
  primary: string;
}) {
  const [mode, setMode] = useState<"owned" | "awaiting_transfer">(
    hasPendingTransfer ? "awaiting_transfer" : "owned"
  );
  const [transfer, setTransfer] = useState<TransferInfo | null>(activeTransfer);

  if (mode === "owned" && currentOwner) {
    return (
      <div style={{ margin: "16px 24px 0" }}>
        <TransferForm
          tagId={tagId}
          currentOwnerEmail={currentOwner.owner_email}
          currentOwnerName={currentOwner.owner_name}
          defaultCurrency={currentOwner.currency || "NGN"}
          accent={accent}
          primary={primary}
        />
      </div>
    );
  }

  if (mode === "awaiting_transfer" && transfer) {
    return (
      <CancelTransferForm
        transferId={transfer.id}
        toName={transfer.to_name}
        toEmail={transfer.to_email}
        onCancelled={() => {
          setTransfer(null);
          setMode("owned");
        }}
      />
    );
  }

  return null;
}

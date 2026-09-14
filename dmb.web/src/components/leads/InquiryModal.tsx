import { useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@mui/material";
import LeadForm from "components/leads/LeadForm";

export const OPEN_INQUIRE_EVENT = "dmb:open-inquire";

export function openInquireModal() {
  window.dispatchEvent(new Event(OPEN_INQUIRE_EVENT));
}

export default function InquiryModal() {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    const onOpen = () => {
      setFormKey((current) => current + 1);
      setOpen(true);
    };
    window.addEventListener(OPEN_INQUIRE_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_INQUIRE_EVENT, onOpen);
  }, []);

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      maxWidth="sm"
      fullWidth
      scroll="paper"
      aria-labelledby="inquire-dialog-title"
    >
      <DialogTitle id="inquire-dialog-title" sx={{ pr: 6, fontWeight: 700, position: "relative" }}>
        Inquire
        <IconButton
          aria-label="Close"
          onClick={() => setOpen(false)}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 2.5 }}>
        {open ? <LeadForm key={formKey} source="funnel-form" variant="inquiry" /> : null}
      </DialogContent>
    </Dialog>
  );
}

/** Ready-made replies for the front desk. {name} becomes the patient's first name. Staff can edit before sending. */
export const QUICK_REPLIES: { label: string; text: string }[] = [
  { label: "Greeting", text: "Hello {name}, thank you for contacting Lisa Hospitals. How can we help?" },
  { label: "Greeting (Kiswahili)", text: "Habari {name}, asante kwa kuwasiliana na Lisa Hospitals. Tukusaidieje?" },
  { label: "Booking confirmed", text: "Your appointment is confirmed. Please arrive 10 minutes early and bring your booking reference." },
  { label: "Moved as asked", text: "We have moved your appointment as you asked. You can see the new time under My visits." },
  { label: "Need reference", text: "Could you please share your booking reference? It starts with LH-." },
  { label: "Doctor unavailable", text: "We are sorry, the doctor is not available on that day. Which other day would suit you?" },
  { label: "Please call us", text: "Please call us on 0784 388 734 so we can help you faster." },
  { label: "Anything else?", text: "Thank you. Is there anything else we can help you with?" },
];

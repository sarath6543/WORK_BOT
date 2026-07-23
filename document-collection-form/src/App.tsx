import { FormEvent, useEffect, useMemo, useState } from 'react';

type CollectionForm = {
  requesterName: string;
  requesterEmail: string;
  clientName: string;
  dueDate: string;
  priority: 'Normal' | 'High' | 'Urgent';
  deliveryChannel: 'Secure upload link' | 'Email attachment' | 'In-person submission' | 'Shared drive folder';
  documents: string[];
  instructions: string;
};

type CollectionPayload = CollectionForm & {
  createdAt: string;
};

type FormErrors = Partial<Record<keyof CollectionForm, string>>;

const storageKey = 'documentCollectionDraft';

const documentOptions = [
  'Government ID',
  'Proof of address',
  'Bank statement',
  'Tax document',
  'Signed agreement',
  'Supporting evidence',
];

const initialForm: CollectionForm = {
  requesterName: '',
  requesterEmail: '',
  clientName: '',
  dueDate: '',
  priority: 'Normal',
  deliveryChannel: 'Secure upload link',
  documents: [],
  instructions: '',
};

function validate(form: CollectionForm): FormErrors {
  const errors: FormErrors = {};

  if (!form.requesterName.trim()) {
    errors.requesterName = 'Requester name is required.';
  }

  if (!form.requesterEmail.trim()) {
    errors.requesterEmail = 'Requester email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.requesterEmail)) {
    errors.requesterEmail = 'Enter a valid email address.';
  }

  if (!form.clientName.trim()) {
    errors.clientName = 'Client or company is required.';
  }

  if (!form.dueDate) {
    errors.dueDate = 'Due date is required.';
  }

  if (form.documents.length === 0) {
    errors.documents = 'Select at least one document.';
  }

  return errors;
}

function buildPayload(form: CollectionForm): CollectionPayload {
  return {
    requesterName: form.requesterName.trim(),
    requesterEmail: form.requesterEmail.trim(),
    clientName: form.clientName.trim(),
    dueDate: form.dueDate,
    priority: form.priority,
    deliveryChannel: form.deliveryChannel,
    documents: form.documents,
    instructions: form.instructions.trim(),
    createdAt: new Date().toISOString(),
  };
}

export default function App() {
  const [form, setForm] = useState<CollectionForm>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState('Draft not saved');
  const [payload, setPayload] = useState<CollectionPayload | null>(null);

  const payloadText = useMemo(
    () => (payload ? JSON.stringify(payload, null, 2) : 'Submit the form to generate JSON.'),
    [payload],
  );

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return;
    }

    try {
      const draft = JSON.parse(raw) as Partial<CollectionForm>;
      setForm({
        requesterName: draft.requesterName ?? initialForm.requesterName,
        requesterEmail: draft.requesterEmail ?? initialForm.requesterEmail,
        clientName: draft.clientName ?? initialForm.clientName,
        dueDate: draft.dueDate ?? initialForm.dueDate,
        priority: draft.priority ?? initialForm.priority,
        deliveryChannel: draft.deliveryChannel ?? initialForm.deliveryChannel,
        documents: Array.isArray(draft.documents) ? draft.documents : [],
        instructions: draft.instructions ?? initialForm.instructions,
      });
      setStatus('Draft loaded');
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, []);

  function updateField<K extends keyof CollectionForm>(field: K, value: CollectionForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleDocument(documentName: string) {
    setForm((current) => {
      const documents = current.documents.includes(documentName)
        ? current.documents.filter((item) => item !== documentName)
        : [...current.documents, documentName];

      return { ...current, documents };
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setPayload(buildPayload(form));
    setStatus('Payload ready');
  }

  function saveDraft() {
    localStorage.setItem(storageKey, JSON.stringify(form));
    setStatus('Draft saved');
  }

  function resetForm() {
    setForm(initialForm);
    setErrors({});
    setPayload(null);
    localStorage.removeItem(storageKey);
    setStatus('Draft not saved');
  }

  async function copyPayload() {
    await navigator.clipboard.writeText(payloadText);
    setStatus('Payload copied');
  }

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 bg-slate-100 px-4 py-6 text-slate-950 md:grid-cols-[1.35fr_0.65fr] lg:px-8">
      <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-xl shadow-slate-900/10 md:p-7" aria-labelledby="page-title">
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase text-teal-700">Intake</p>
            <h1 id="page-title" className="text-4xl font-black leading-none tracking-normal text-slate-950 md:text-6xl">
              Document Collection Form
            </h1>
          </div>
          <div className="w-fit rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600" aria-live="polite">
            {status}
          </div>
        </header>

        <form className="grid gap-6" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Requester name" error={errors.requesterName}>
              <input
                className="form-input"
                name="requesterName"
                autoComplete="name"
                value={form.requesterName}
                onChange={(event) => updateField('requesterName', event.target.value)}
                required
              />
            </Field>

            <Field label="Requester email" error={errors.requesterEmail}>
              <input
                className="form-input"
                name="requesterEmail"
                type="email"
                autoComplete="email"
                value={form.requesterEmail}
                onChange={(event) => updateField('requesterEmail', event.target.value)}
                required
              />
            </Field>

            <Field label="Client or company" error={errors.clientName}>
              <input
                className="form-input"
                name="clientName"
                value={form.clientName}
                onChange={(event) => updateField('clientName', event.target.value)}
                required
              />
            </Field>

            <Field label="Due date" error={errors.dueDate}>
              <input
                className="form-input"
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={(event) => updateField('dueDate', event.target.value)}
                required
              />
            </Field>

            <Field label="Priority">
              <select
                className="form-input"
                name="priority"
                value={form.priority}
                onChange={(event) => updateField('priority', event.target.value as CollectionForm['priority'])}
              >
                <option>Normal</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
            </Field>

            <Field label="Delivery channel">
              <select
                className="form-input"
                name="deliveryChannel"
                value={form.deliveryChannel}
                onChange={(event) => updateField('deliveryChannel', event.target.value as CollectionForm['deliveryChannel'])}
              >
                <option>Secure upload link</option>
                <option>Email attachment</option>
                <option>In-person submission</option>
                <option>Shared drive folder</option>
              </select>
            </Field>
          </div>

          <fieldset className="rounded-lg border border-slate-300 p-5">
            <legend className="px-2 text-base font-extrabold">Documents requested</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {documentOptions.map((documentName) => (
                <label key={documentName} className="flex min-h-8 items-center gap-3 font-semibold text-slate-600">
                  <input
                    className="h-5 w-5 accent-teal-700"
                    type="checkbox"
                    name="documents"
                    value={documentName}
                    checked={form.documents.includes(documentName)}
                    onChange={() => toggleDocument(documentName)}
                  />
                  {documentName}
                </label>
              ))}
            </div>
            <ErrorText message={errors.documents} />
          </fieldset>

          <Field label="Additional instructions">
            <textarea
              className="form-input min-h-32 resize-y"
              name="instructions"
              rows={5}
              placeholder="Add exact naming rules, upload notes, or special review requirements."
              value={form.instructions}
              onChange={(event) => updateField('instructions', event.target.value)}
            />
          </Field>

          <div className="flex flex-wrap gap-3">
            <button className="btn-primary" type="submit">
              Create request JSON
            </button>
            <button className="btn-secondary" type="button" onClick={saveDraft}>
              Save draft
            </button>
            <button className="btn-ghost" type="button" onClick={resetForm}>
              Reset
            </button>
          </div>
        </form>
      </section>

      <aside className="rounded-lg border border-slate-300 bg-white p-5 shadow-xl shadow-slate-900/10 md:sticky md:top-6 md:self-start" aria-labelledby="output-title">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-bold uppercase text-teal-700">Output</p>
            <h2 id="output-title" className="text-xl font-black text-slate-950">
              Request payload
            </h2>
          </div>
          <button className="btn-secondary min-h-9 px-3 text-sm" type="button" onClick={copyPayload}>
            Copy
          </button>
        </div>
        <pre className="mt-5 max-h-[calc(100vh-11rem)] min-h-96 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm leading-6 text-emerald-100">
          {payloadText}
        </pre>
      </aside>
    </main>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 font-bold text-slate-950">
      {label}
      {children}
      <ErrorText message={error} />
    </label>
  );
}

function ErrorText({ message }: { message?: string }) {
  return <span className="min-h-5 text-sm font-semibold text-red-700">{message ?? ''}</span>;
}

// One place for the words and links every page shares.

export const site = {
  name: "doze",
  url: "https://doze-dev.com",
  tagline: "Run your whole stack. Feel none of it.",
  description:
    "Real databases, queues and AWS on your laptop as native processes. They wake when you call and sleep when you stop. No VM, no fans, no port chaos.",
  github: "https://github.com/doze-dev",
  install: "brew install doze-dev/tap/doze",
};

export type Product = {
  id: "doze" | "aws" | "kafka";
  name: string;
  href: string;
  docs: string;
  logo: string;
  accent: string;
  line: string;
};

export const products: Product[] = [
  {
    id: "doze",
    name: "doze",
    href: "/doze/",
    docs: "/docs/doze/",
    logo: "/brand/doze.svg",
    accent: "var(--amber)",
    line: "Your whole stack from one file. Sleeps when you stop.",
  },
  {
    id: "aws",
    name: "doze AWS",
    href: "/aws/",
    docs: "/docs/aws/",
    logo: "/brand/doze-aws.svg",
    accent: "var(--sky)",
    line: "All of AWS. None of the account.",
  },
  {
    id: "kafka",
    name: "doze Kafka",
    href: "/kafka/",
    docs: "/docs/kafka/",
    logo: "/brand/doze-kafka.svg",
    accent: "var(--kafka)",
    line: "Kafka without the JVM.",
  },
];

export const nav = [
  { label: "doze", href: "/doze/" },
  { label: "doze AWS", href: "/aws/" },
  { label: "doze Kafka", href: "/kafka/" },
  { label: "Registry", href: "/registry/" },
  { label: "Docs", href: "/docs/doze/" },
];

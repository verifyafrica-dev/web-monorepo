import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@verifyafrica/ui/components/ui/card";
import { CodeBlock } from "#/components/ui-extended/code-block";

const STEPS = [
	{
		title: "Create a monitor",
		body: "Pick a template or build your own set of weighted rules. Each monitor gets an ID.",
	},
	{
		title: "Score before you settle",
		body: "Send each payment to the score endpoint. You get back allow, review or block, with reasons.",
	},
	{
		title: "Report the outcome",
		body: "Tell us later whether it was fraud, a chargeback or legitimate so the model keeps improving.",
	},
	{
		title: "Work the cases",
		body: "High-risk scores open cases automatically. Triage them and draft regulatory reports.",
	},
] as const;

const SCORE_EXAMPLE = `curl -X POST "$VERIFYAFRICA_API_URL/api/v2/public/transaction-monitoring/score/" \\
  -H "Authorization: Bearer $VERIFYAFRICA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "monitor_id": "<your monitor id>",
    "amount": 900000,
    "currency": "NGN",
    "channel": "transfer",
    "country": "NG",
    "customer_ref": "cust-001"
  }'`;

const OUTCOME_EXAMPLE = `curl -X POST "$VERIFYAFRICA_API_URL/api/v2/public/transaction-monitoring/outcome/" \\
  -H "Authorization: Bearer $VERIFYAFRICA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "transaction_id": "<from the score response>", "outcome": "legit" }'`;

export function OverviewTab({ onCreate }: { onCreate: () => void }) {
	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<p className="max-w-2xl text-sm text-muted-foreground">
					Verification tells you who your customer is. Transaction Monitoring
					watches what they do with money, scoring every payment in real time
					against rules you choose.
				</p>
				<Button onClick={onCreate}>Create a monitor</Button>
			</div>

			<ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{STEPS.map((step, index) => (
					<li key={step.title}>
						<Card className="h-full">
							<CardHeader>
								<span className="flex size-7 items-center justify-center rounded-full bg-secondary/10 text-sm font-semibold text-secondary tabular-nums">
									{index + 1}
								</span>
								<CardTitle className="text-base">{step.title}</CardTitle>
								<CardDescription>{step.body}</CardDescription>
							</CardHeader>
						</Card>
					</li>
				))}
			</ol>

			<div className="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Score a transaction</CardTitle>
						<CardDescription>
							Authenticate with your API key. Send every field in your
							monitor&apos;s data contract.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<CodeBlock code={SCORE_EXAMPLE} language="bash" copyable wrap />
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Report the outcome</CardTitle>
						<CardDescription>
							One of <code>fraud</code>, <code>chargeback</code> or{" "}
							<code>legit</code>.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<CodeBlock code={OUTCOME_EXAMPLE} language="bash" copyable wrap />
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Act on the verdict</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-3 text-sm sm:grid-cols-3">
					<p>
						<strong className="font-medium">allow</strong>
						<span className="text-muted-foreground">
							{" "}
							— settle the payment.
						</span>
					</p>
					<p>
						<strong className="font-medium">review</strong>
						<span className="text-muted-foreground">
							{" "}
							— hold it, ask for step-up verification, or queue it for your
							team.
						</span>
					</p>
					<p>
						<strong className="font-medium">block</strong>
						<span className="text-muted-foreground">
							{" "}
							— reject the payment.
						</span>
					</p>
				</CardContent>
			</Card>
		</div>
	);
}

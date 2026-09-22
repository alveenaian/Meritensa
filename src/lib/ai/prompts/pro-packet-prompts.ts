export function getProPacketPrompts(caseContext: string, state: string) {
  return {
    executiveSummary: `${caseContext}

## YOUR TASK: EXECUTIVE SUMMARY

You are writing a one-page executive summary for a busy contingency law firm partner. Partners decide in 60 seconds whether to keep reading. They care about four things: can I win, how much, can I collect, and will a threshold defense kill it before trial.

Write this as a deal memo, not a narrative. Lead with the money.

Structure:
- **Defendant**: Name, type, and why they can pay (or why collectability is a concern)
- **Core Theory**: One sentence — the strongest framing of this case
- **Damages Range**: Conservative / Realistic / Best case, with basis for each
- **Attorney Fee at 33% Contingency**: For each damages scenario
- **SOL Status**: Deadline date, days remaining, any tolling arguments available
- **Top Strength**: The single best fact or legal argument for plaintiff
- **Top Risk**: The single biggest obstacle to recovery
- **Recommended Next Step**: What should happen next, specifically

If the case is weak, say so. Partners distrust optimistic intake packets. Candor builds credibility.`,

    adversarialLiability: `${caseContext}

## YOUR TASK: ADVERSARIAL LIABILITY ANALYSIS

Conduct a liability analysis by thinking as BOTH the plaintiff's best attorney AND the defendant's best attorney simultaneously. This is the most important section of the entire analysis.

For each cause of action, structure your analysis as:

### [CAUSE OF ACTION NAME] — ${state || 'the relevant jurisdiction'} Law

**Required Elements in ${state || 'the relevant jurisdiction'}:**
List the actual legal elements required to prove this claim in this state.

**PLAINTIFF'S BEST ATTORNEY argues:**
- For each element, cite the specific facts from the narrative, intake, or documents that support it
- Identify the strongest version of this claim — the framing most favorable to plaintiff
- Note what discovery would likely surface to fill any gaps
- If there's a fiduciary duty, mentor relationship, or position of trust, explain how it strengthens the claim

**DEFENDANT'S BEST ATTORNEY argues:**
- For each element, identify the strongest attack
- State the most likely affirmative defenses: waiver, estoppel, ratification, assumption of risk, comparative fault, statute of frauds, etc.
- Identify the motion to dismiss arguments they'd file
- Point to facts in the plaintiff's OWN story that hurt them

**ADVERSARIAL CROSS-CHECK — ask these questions:**
- Was any action the plaintiff took (acceptance, waiver, silence, delay) itself induced by the defendant's misrepresentations? If so, the defense argument based on that action collapses.
- Did the defendant occupy a position of trust, authority, or mentorship? If so, plaintiff's reliance was more reasonable and defendant's duties were higher.
- Are there separate accrual dates for fraud claims vs. breach claims? Don't conflate them.
- Does the continuing violation doctrine apply (series of acts, not single transaction)?
- Is there a parallel fiduciary duty claim?

**SENIOR PARTNER'S ASSESSMENT:**
- Would this survive a motion to dismiss? (likely yes / uncertain / likely no)
- What's the probability a jury finds for plaintiff? (percentage with reasoning)
- What's the settlement leverage before trial?
- Would a reasonable contingency firm take this? Why or why not?`,

    solAndThresholdDefenses: `${caseContext}

## YOUR TASK: SOL AND THRESHOLD DEFENSE ANALYSIS

You are a litigator preparing for the defendant's motion to dismiss. Identify every threshold defense and write BOTH the motion AND the opposition.

### STATUTE OF LIMITATIONS

For each cause of action:
1. State the applicable SOL period in ${state || 'the relevant state'} with the specific statute or rule
2. Calculate the deadline from the incident date (or discovery date if provided)
3. State the defendant's best accrual theory — when they'll argue the clock started

4. For EACH defense accrual theory, systematically evaluate these counter-arguments:

   a) **Discovery Rule**: When did plaintiff actually know or have reason to know of the SPECIFIC wrong (not just that something went badly)? If this is a fraud case, when did they know it was fraud vs. mere breach?
   
   b) **Fraudulent Concealment Tolling**: Did defendant actively hide the wrongdoing? Even one instance of concealment, destruction of evidence, false explanations, or stringing plaintiff along restarts this analysis entirely.
   
   c) **Equitable Estoppel**: Did defendant's conduct prevent timely filing? Did they make promises to resolve the matter? Did they tell plaintiff not to worry or not to get a lawyer?
   
   d) **Continuing Violation**: Was this a series of acts over time? Each new act may have its own SOL. When was the LAST actionable event?
   
   e) **Fraudulent Inducement of Waiver**: Was the plaintiff's "acceptance" or apparent waiver ITSELF procured by defendant's misrepresentation? If defendant lied about their authority, misrepresented the legal situation, or used a position of trust to convince plaintiff nothing was wrong — the waiver is voidable and cannot serve as the accrual date. THIS IS CRITICAL TO CHECK.

5. **Court's Likely Ruling**: How would a judge rule on a 12(b)(6) motion raising SOL? Is this a question of law (decided on the motion) or a question of fact (goes to jury)?

### OTHER THRESHOLD DEFENSES

For each that applies (skip those that clearly don't):
- **Arbitration clause**: Is there one? Quote it. Is it enforceable? Unconscionability arguments?
- **Preemption**: Federal vs. state claims conflict?
- **Standing**: Does plaintiff have standing to bring each claim?
- **Failure to exhaust administrative remedies**: For employment claims especially
- **Statute of frauds**: If the agreement was oral

For each: state the attack, state the best response, assess likelihood of surviving.`,

    damagesMemo: `${caseContext}

## YOUR TASK: DAMAGES ANALYSIS AND FEE CALCULATION

You are a damages expert preparing a memo for a partner who needs to see the fee calculation before reading anything else.

### ECONOMIC DAMAGES

For each category of loss the plaintiff described:
- State the amount claimed
- State whether it is DOCUMENTED (receipts, records, bank statements, contracts) or ESTIMATED (plaintiff's statement only)
- Note what documentation would strengthen the claim
- Partners discount undocumented estimates by 50-70%. Be explicit about this.

Categories to evaluate (include only those that apply):
- Direct financial losses (money paid out, money owed and not received)
- Lost income or wages
- Lost business opportunity or profits (must have basis — not speculative)
- Costs incurred as a result of defendant's conduct
- Future economic losses (only if clearly articulable with basis)

### NON-ECONOMIC DAMAGES
- Emotional distress: only if the jurisdiction and claim type support it. State the standard in ${state || 'the relevant state'}.
- Other non-economic: loss of consortium, loss of enjoyment, reputational harm — only if applicable
- Note: some claim types (breach of contract) generally do NOT allow non-economic damages. Flag this.

### PUNITIVE DAMAGES
- Include ONLY if the conduct genuinely supports it (fraud, malice, oppression, willful misconduct)
- State the standard and any caps in ${state || 'the relevant state'}
- If not supportable, explicitly say "punitive damages are unlikely on these facts" — do NOT include them to inflate the number

### FEE CALCULATION TABLE
| Scenario | Total Damages | Attorney Fee (33%) | Attorney Fee (40%) |
|----------|--------------|-------------------|-------------------|
| Conservative | $ | $ | $ |
| Realistic | $ | $ | $ |
| Best Case | $ | $ | $ |

### COLLECTABILITY ASSESSMENT
- Defendant type: individual / LLC / corporation / insured / government
- If corporation: public/private, size indicators, assets
- If individual: any known assets, employment, property
- Insurance coverage possibility (liability insurance, E&O, D&O)
- Bankruptcy risk
- Bottom line: is a judgment collectible?`,

    riskRegister: `${caseContext}

## YOUR TASK: RISK REGISTER

Build a risk register for this case. For each REAL risk (do not manufacture risks for balance):

| Risk | Severity | Defense Argument | Plaintiff's Response | Evidence Needed |
|------|----------|-----------------|---------------------|-----------------|

Severity levels: CRITICAL (case-killer if not addressed), HIGH (significant obstacle), MEDIUM (manageable concern), LOW (minor issue)

Risks to evaluate (include ONLY those that actually apply to this case):
- SOL expired or near-expiration
- Weakest element in the strongest cause of action
- Plaintiff's own conduct that looks like waiver, acceptance, ratification, or delay
- Arbitration clause in the agreement
- Defendant is judgment-proof or has no assets
- Key evidence is oral-only with no documentation or corroboration
- Inconsistencies in plaintiff's timeline or narrative
- Comparative fault or contributory negligence
- Claims requiring proof of intent supported only by circumstantial evidence
- Missing witnesses or unavailable evidence
- Adverse prior legal action or government findings
- Plaintiff's credibility concerns

After the table, provide:

**OVERALL RISK ASSESSMENT**: Would a reasonable contingency firm take this case given this risk profile? Answer directly: YES (with confidence), LIKELY YES (manageable risks), UNCERTAIN (significant risks but viable arguments), LIKELY NO (risks outweigh potential), or NO (case is not viable). Explain why in 2-3 sentences.`,

    recommendations: `${caseContext}

## YOUR TASK: RECOMMENDATIONS AND NEXT STEPS

Based on the complete case analysis, provide 5-7 specific, actionable recommendations in priority order.

1. **URGENT** items first: SOL deadlines, evidence that could disappear, witnesses to contact immediately
2. **Evidence to gather**: Specific documents, records, or testimony that would strengthen the weakest elements
3. **Type of attorney to seek**: Be specific — "employment law attorney experienced in FLSA overtime claims in ${state || 'your state'}" not "a lawyer." If there's a relevant specialty bar association or referral service, mention it.
4. **Case viability assessment**: Is this suitable for contingency representation? Hourly? Hybrid? If contingency is unlikely, say so directly and explain what would need to change.
5. **What NOT to do**: Common mistakes plaintiffs make — communicating with the defendant, posting on social media, missing deadlines, destroying evidence, making verbal agreements

If the case is weak, be honest. The worst outcome for a plaintiff is spending time and money pursuing a case that no competent firm will take. Say what would need to be true for this case to become viable.

End with a single sentence: "Based on this analysis, the recommended course of action is [specific recommendation]."`,

    outreachEmail: `${caseContext}

## YOUR TASK: OUTREACH EMAIL DRAFT

You are writing a short, professional email that the plaintiff can send to contingency law firms. This is NOT their full story — it's a pitch designed to get a partner to open the attached case packet.

Partners receive hundreds of cold intake emails. Most are rambling, emotional, and get deleted. Yours needs to hit their decision points in 4-5 sentences.

**Structure:**
1. **Opening**: One sentence stating case type and jurisdiction
2. **Theory**: One sentence with the core legal theory
3. **Defendant**: One sentence identifying defendant type and collectability indicators
4. **Damages**: One sentence with damages range (conservative estimate)
5. **Closing**: One sentence noting that full case packet is attached and SOL status if urgent

**Tone:**
- Professional but not stiff
- Factual, not emotional
- Confident but not arrogant
- Direct and concise

**Example format (adapt to this case):**
"I am seeking contingency representation for a breach of written contract claim in [State]. [Defendant Name], a [defendant type], failed to [core breach] despite [key fact that makes liability clear]. The defendant [collectability indicator - e.g., is a profitable corporation / has liability insurance / owns substantial real property]. Documented damages are estimated at $[conservative amount]. A complete case packet with timeline, evidence inventory, and legal analysis is attached. [If SOL urgent: The statute of limitations deadline is [date], requiring prompt action.]"

Write the email for THIS case. Use the plaintiff's actual facts. Do not use placeholder brackets — fill in real information. If information is missing, omit that sentence rather than using a placeholder.`,

    humanNarrative: `${caseContext}

## YOUR TASK: PLAIN ENGLISH STORY

Write a clear, accessible summary of what happened in this case. This is NOT a legal document — it's the version the plaintiff would tell a friend, family member, or journalist.

**Purpose:**
- Help the plaintiff explain their case to non-lawyers
- Provide a narrative they can use in initial phone calls with attorneys
- Give them a "public version" they can share without legal jargon

**Guidelines:**
- Write in plain English — no legal terms unless absolutely necessary
- Tell it chronologically as a story
- Focus on what actually happened, not legal theories
- Include emotional context where relevant (this person was wronged — how?)
- Be specific about dates, amounts, and key facts
- Keep it to 3-4 paragraphs

**Structure:**
1. **Who and What**: Who is the plaintiff, who is the defendant, what was the relationship?
2. **What Happened**: What went wrong? What did the defendant do (or fail to do)?
3. **Impact**: How did this harm the plaintiff? What are the consequences?
4. **Where Things Stand**: What has happened since? Has the plaintiff tried to resolve this?

**Tone:**
- Clear and straightforward
- Factual but human
- Not overly emotional, but acknowledge the real impact
- Written as if explaining to someone who knows nothing about law

Write this narrative for THIS case based on the information provided. Use the plaintiff's actual story. Make it readable and relatable.`,
  };
}

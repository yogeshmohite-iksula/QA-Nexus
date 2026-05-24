# AC042 corpus — labeling worksheet (Yogesh action required)

> **Created:** Day-25 Sun 2026-05-24 (BE+1 mechanical port pass)
> **Action:** Fill the YAML block under each section's "GROUND TRUTH" heading.
> **Goal:** 45 cases labeled → `node scripts/apply-cpi-labels.mjs` promotes
> staged → live → `pnpm --filter @qa-nexus/api ac042:eval` runs binding AC042
> on the full 50-defect corpus.
>
> **Time estimate:** ~2-3 hr for 45 cases at ~3 min each (read description +
> comments, decide category, write 1-2 sentence detail).
>
> **The 10 categories (from ADR-019 §2):**
>
> - `code-bug`
> - `data-bug`
> - `env-config`
> - `flaky-network`
> - `auth-permissions`
> - `dependency-version`
> - `ui-regression`
> - `race-condition`
> - `payment-gateway`
> - `other`
>
> **How to decide:** read the description + comments below each section.
> Map to one category as the primary. List up to 2 other categories a senior
> reviewer could defend as acceptable alternatives. Set confidence based on
> how clear the evidence is. The "TODO-YOGESH" placeholders in the staged
> JSON files are NOT used — `apply-cpi-labels.mjs` extracts your values
> from THIS file's YAML blocks.

---

## def-006 — CPI-372 · _Mail are not trigger as per the PMG selected in NPI._

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-901`
- environment: `staging-iksula`
- durationMs: 7404

**Source description:**

> e.g. Created a New NPI and it is under the coated Industrial > belt But Mail are go to Different Product Developers Pandu_B -- Bonded Industrial. >Thinwheel, Thinwheel G2 Gopalakrishnan_C - Coated Industrial > Sheets Mathews_Reji -- Coated Retail > Sheets Retail

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 18/Jul/25: Pls check with Product Manager with their PMG and check with their respected Product Developer with their PMG’s.
- 22/Jul/25: Check for 2 scenario: A) coated retail > sheet retail B) Bonded Industrial > Thin wheel Both the scenario, in the Product workflow, Mail trigger to correct user. A) coated retail > sheet retail [ADF table elided] B) Bonded Industrial > Thin wheel [ADF table elided] [screenshot elided] [screenshot elided] [screenshot elided] [screenshot elided]

**Source metadata:** priority=Highest · status=Done · resolution=Done · resolved=14/Nov/25 3:51 PM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-006 (CPI-372)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-007 — CPI-387 · _Email Notification Not Triggered for Certain Update Workflow Transitions in Product Workflow (PIM)_

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-902`
- environment: `staging-iksula`
- durationMs: 5065

**Source description:**

> _Description:_ In the PIM Product Workflow, email notifications are not triggered for specific transitions performed by _Product Head_ and _Marketing Head_. These transitions are expected to send emails but currently result in _no email being triggered_. |Role|Current Status|Action Taken|New Status|Mail Expected To|Mail Triggered| |Product Head|InReview|Update to Marketing Manager|Update Required|To: Marketing Manager CC: Product Manager|❌ No| |Marketing Head|InReview|Update to Marketing Manager|Update Required|To: Marketing Manager CC: Product Manager|❌ No| |Marketing Head|InReview|Update to Product Head|Update Required|To: Product Head CC: Product Manager, Marketing Manager|❌ No| _Expected Result:_ For each of the above workflow actions, an email should be triggered as per the…

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 29/Jul/25: Mail is trigger correctly for marketing manager and Product manager in Reopen workflow but when the Marketing Head make an action “Update to Product Head”. them mail is trigger To: Product Head and in CC: Product Manager is there but _in CC: Marketing Manager mail is not present_ [screenshot elided]
- 30/Jul/25: Done to sending Mail to Marketing Manager.
- 31/Jul/25: All the Update mail trigger correctly [ADF table elided] [screenshot elided] [screenshot elided] [screenshot elided]

**Source metadata:** priority=High (migrated) · status=Done · resolution=Done · resolved=21/Nov/25 7:16 PM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-007 (CPI-387)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-008 — CPI-341 · _Remove DAM tab till the product is approved for PM, PH, MM. once the product is approved then only dam tab should be visible as per permissions_

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-903`
- environment: `local-dev`
- durationMs: 10172

**Source description:**

> Remove DAM tab till the product is approved for pm, ph, mm. once the product is approved then only dam tab should be visible as per permissions

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 25/Jun/25: Product Manager & Product Head after approved the Product, DAM tab field are not disable.
- 26/Jun/25: For disabled DAM tab is different things and DAM tab attributes needs to disabled is different things.
- 26/Jun/25: In DAM tabs fields are disabled but Image and Video fields not possible to do disabled.
- 07/Jul/25: In PIM UI, DAM tab is showing as per the Following Table: | |Product| | | | | | | | | |ERP|DAM - Before prodcut approval|DAM - After prodcut approval| |Admin|Tab Visible | Fields Editable|Tab Visible | Fields Editable|Tab Visible | Fields Editable| |Product Manager|Tab Visible | Fields Editable|Tab Invisible|Tab Visible | Fields Disable| |Product Dev|Tab Visible | Fields Disable|Tab Invisible|Tab Invisible| |SCM|Tab Visible | Fields Disable|Tab Invisible|Tab Invisible| |Marketing Manager|Tab Visible | Fields Disable|Tab Invisible|Tab Visible | Fields Editable| |Product Head|Tab Visible | Fields Disable|Tab Invisible|Tab Visible | Fields Disable| |Marketing Head|Tab Disable|Tab Invisible|Tab Visible | Fields Editable| | | | | | |DAM|Tab Invisible|Tab Visible | Fields…

**Source metadata:** priority=Highest · status=Done · resolution=Done · resolved=19/Sep/25 11:34 AM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-008 (CPI-341)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-009 — CPI-345 · _SAG should come on the selection of PMG_

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-904`
- environment: `staging-iksula`
- durationMs: 2696

**Source description:**

> SAG should come on the selection of PMG

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 26/Jun/25: Done on Dev and Uat Server.
- 26/Jun/25: SAG Dropdown Values are showing as per the PMG Selected. It working as expected. Only some of the PMG have some extra added or some PMG don't have some SAG’s. # {color:#ff5630}_Industrial > Boned Industrial > Vitrified > All SAG are Present . [ Please remove test SAG - Brick &Block123 , TestSAGNew From list. ]_ {color} # Industrial > Boned Industrial > Resinoid & Rubber > All SAG are Present. # {color:#ff5630}_Industrial > Boned Industrial > THIN WHEEL > All SAG are Present. [ SAG - 7” Dc - Agni is not present in list. Please Add.]_{color} # Industrial > Boned Industrial > Thin Wheel G2 > All SAG are Present. # Retail > Bonded Retail > Thin Wheel G2 Retail > All SAG are Present. # Retail > Bonded Retail > Super Abrasive Retail > All SAG are Present. # Industrial > Coated…
- 26/Jun/25: All the SAG values are showing correctly as per the PMG selected. SAG is working As expected [screenshot elided] [screenshot elided] [screenshot elided] [screenshot elided]

**Source metadata:** priority=Highest · status=Done · resolution=Done · resolved=27/Nov/25 8:12 PM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-009 (CPI-345)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-010 — CPI-344 · _For DAM tab please refer updated table for rolewise permissions_

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-905`
- environment: `prod-iksula`
- durationMs: 8719

**Source description:**

> For DAM tab please refer updated table

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 07/Jul/25: IN PIM UI, DAM tab is showing as per the Following Table: | |Product| | | | | | | | | | | |ERP|DAM - Before prodcut approval|DAM - After prodcut approval|Status| |Admin|Tab Visible | Fields Editable|Tab Visible | Fields Editable|Tab Visible | Fields Editable|Fail| |Product Manager|Tab Visible | Fields Editable|Tab Invisible|Tab Visible | Fields Disable|Pass| |Product Dev|Tab Visible | Fields Disable|Tab Invisible|Tab Invisible|Pass| |SCM|Tab Visible | Fields Disable|Tab Invisible|Tab Invisible|Pass| |Marketing Manager|Tab Visible | Fields Disable|Tab Invisible|Tab Visible | Fields Editable|Pass| |Product Head|Tab Visible | Fields Disable|Tab Invisible|Tab Visible | Fields Disable|Pass| |Marketing Head|Tab Disable|Tab Invisible|Tab Visible | Fields Editable|Pass| | | | | | |…

**Source metadata:** priority=Highest · status=Done · resolution=Done · resolved=19/Sep/25 11:35 AM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-010 (CPI-344)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-011 — CPI-376 · _Restrict Future Date Selection in ERP Form Date Filters_

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-906`
- environment: `staging-iksula`
- durationMs: 7889

**Source description:**

> This functionality will be developed in Phase 2. h3. _Description:_ _Issue:_ In the ERP form, users are currently able to select _future dates_ in the _Start Date_ and _End Date_ fields. This leads to incorrect behavior in the PIM ID listing, as no PIM IDs are created with future dates. As a result, the filter returns no records. _Expected Behavior:_ * Users should *not be allowed* to select any *future date* in either the *Start Date* or *End Date* fields. * The date picker should be restricted to allow selection _only up to the current date (today)_. _Impact:_ _ Prevents confusion and improves the accuracy of the filter results. _ Ensures valid data retrieval based on actual PIM ID creation dates. _Scope:_ \* Applicable to the ERP form's Start Date and End Date fields used for filtering…

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 15/Sep/25: [~accountid:712020:12a0993c-2b54-48f2-9527-9d90d5db0a2c] As disccused with you , the record is being saved with today’s date in the database, but it is displayed as tomorrow’s date. Since this involves customized ExtJS code, it should be debug to check why the PIM ID is not appearing despite being saved correctly in the database. Please debug this. The record is getting saved with today’s date in the database, but it’s showing up as tomorrow’s date. cc: [~accountid:712020:edb6975e-6657-4571-a61c-9d16c7ba2a83]
- 03/Oct/25: Done and Update on UAT and PROD Server.
- 23/Oct/25: In the ERP user, 1) Create a new NPI [TestDate] on 23 oct 2025 and go thought Product workflow. The product is to ERP team. While select the start and End date. Product is showing at correct Date [23 oct 2025 ]. Sothe issue - the record is being saved with today’s date in the database, but it is displayed as tomorrow’s date. – _is solved_ [screenshot elided] 2) I try to select the Future date in Start and End date. It accept the Future Dates. [screenshot elided]
- 24/Oct/25: Done on UAT and PROD server. [screenshot elided]
- 27/Oct/25: A. When try to select the Future date in Start and End date. It won't accept the Future Dates. – _is solved_ [screenshot elided] [screenshot elided]

**Source metadata:** priority=Medium · status=Done · resolution=Done · resolved=27/Oct/25 7:17 PM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-011 (CPI-376)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-012 — CPI-377 · _Error Showing After Product Approval Opening, Due to Invalid SAGDescription value error showing while opening the item._

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-907`
- environment: `local-dev`
- durationMs: 5819

**Source description:**

> h3. _Description:_ _Issue:_ When creating a new NPI and the ERP team adds the item code, the product is moved from the _NPI section to the Coated section_. At this point, an error occurs related to the _SAGDescription_ field. _Error Message:_ {{Invalid Option field [ SAGDescription ]: Please choose a valid option for select / multiselect field [ SAGDescription ]. Current value: "YS592-Ceramic BELTS"}} _Observation:_ * The value {{"YS592-Ceramic BELTS"}} is *already present in the Data Model sheet* under the *BELT PMG* category. * This suggests a _mismatch between the configured dropdown values in the system and the master data_. _Expected Behavior:_ * The value {{"YS592-Ceramic BELTS"}} should be recognized as valid and not throw an error during the product movement process. *Action…

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 22/Jul/25: Pls re-check it’s open perfectly. [screenshot elided]
- 23/Jul/25: Error Still Showing Steps 1) Create a new NPI 2) Select the Coated Industrial > Belt & other > YS592-Ceramic BELTS 3) completed the Product workflow and add the ERP code and SAVE. 4) Now the Product is move to Coated industrial Folder. 5) Open the same product in the DAM user. Show the Error. [screenshot elided]
- 23/Jul/25: Have you assign Permission of Product Object for DAM Manager? [screenshot elided] [screenshot elided]
- 24/Jul/25: Resolved on Dev and UAT.
- 29/Jul/25: Check for 2 different NPI. Invalid SAGDescription value error not showing while opening the item. [screenshot elided] [screenshot elided]

**Source metadata:** priority=High (migrated) · status=Done · resolution=Done · resolved=30/Sep/25 11:49 AM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-012 (CPI-377)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-013 — CPI-404 · _Incorrect email notifications and missing post approval user in Change SKU workflow_

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-908`
- environment: `prod-iksula`
- durationMs: 11237

**Source description:**

> _Environment: Production_ _ Workflow: Change SKU _ Notification: Email Trigger _Steps to Reproduce:_ # SKU belongs to _Bonded Retail > Super Abrasive Retail_. # Product Developer approves the SKU and sends it to _Product Manager_. # Observe the email notification and in-app notification. _Expected Result:_ * Email should be sent only to the correct *Product Manager (Retail)_. _ Mail body should correctly display the _post approval user (Product Head)_. * Notification should open the correct workflow item without errors. *Actual Result:* # Email is incorrectly triggered to *DISC Manager – Suthirraj S D (_[_suthirrajsd@cumi.murugappa.com_|mailto:suthirrajsd@cumi.murugappa.com]\_)* instead of Product Manager. # Email body does not show the *post approval user (Product Head)\*. # SKU is from…

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 23/Sep/25: [~accountid:712020:12a0993c-2b54-48f2-9527-9d90d5db0a2c] Please try to debug the issue on your own first. It seems some default pimcore permission issue. We can connect tommorrow on your findings and blocker on this to resolve this ticker.
- 26/Sep/25: Done changes on UAT and PROD server, pls check and confirm. Also allow permission to Product Head to open notification process.
- 29/Sep/25: [~accountid:712020:12a0993c-2b54-48f2-9527-9d90d5db0a2c] [~accountid:712020:6dbf8ce9-e3d4-4f0e-b6fa-4159f0beb285] Please ensure allow permission only to Product Head Retail which have Retail vertical only. Product head industrial allow only for Industrial vertical product.
- 12/Nov/25: Working as expected. [screenshot elided] [screenshot elided] [screenshot elided]

**Source metadata:** priority=Highest · status=Done · resolution=Done · resolved=12/Nov/25 12:23 PM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-013 (CPI-404)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-014 — CPI-392 · _Incorrect Action Buttons Displayed in SKU Update Workflow_

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-909`
- environment: `staging-iksula`
- durationMs: 2804

**Source description:**

> _Description:_ The action button dropdown menus are not displaying the correct options for each user role, deviating from the prescribed workflow: \* _Product Developer_ should see only the _"Approve"_ button, but currently sees _"SKU Enrichment Done"_. \* _Product Manager_ should see _"SKU Enrichment Done"_ in the action dropdown (_after initial approval and enrichment step_), but currently sees _"Approve"_. \* _"Update"_ button must be removed from the Product Manager's action button in all scenarios except when specifically required by role/workflow. \* _Product Head_ should see only an _"Update to Product Manager"_ button (rename from "Update"), but currently this is inconsistent. \* _Product Manager_, in the update flow after Product Head requests an update, should see an action button…

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 06/Aug/25: updated workflow !image-20250806-112432.png|width=512,height=519,alt="image-20250806-112432.png"!
- 07/Aug/25: Done to allow both status for Product Manager on Dev and UAT.
- 08/Aug/25: [~accountid:712020:12a0993c-2b54-48f2-9527-9d90d5db0a2c] [~accountid:712020:6dbf8ce9-e3d4-4f0e-b6fa-4159f0beb285] As discussed, we need to add only ‘Approve’ action for Product Manager in Change management workflow. Similarly for Update flow (Rejection), action ‘SKU Enrichment done after Update’ only should be displayed for Product Manager. This is already implemented.
- 08/Aug/25: Done on Dev and UAT.
- 08/Aug/25: It working as expected At this condition Product Developer shows "SKU Enrichment Done" and In Product Manager shows "Approve" & in the update flow showing "SKU Enrichment Done After Update". [screenshot elided]

**Source metadata:** priority=Highest · status=Done · resolution=Done · resolved=12/Nov/25 1:29 PM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-014 (CPI-392)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-015 — CPI-179 · _After creating the product,PIM ID should be shown by default in ERP Form page._

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-910`
- environment: `local-dev`
- durationMs: 11145

**Source description:**

> After creating the product,PIM ID should be shown by default in ERP Form page.

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 17/Mar/25: [~accountid:712020:6ad09b37-0830-44f3-a3a0-09cf116d5532] After create the new Product the PIM id will not generate. We have to enter some information in the ERP layout then click on save button then automatically the PIM id will be assigned. Initially we can’t be able to get the product id after create. That’s why it will not came in Pim id flag.
- 18/Mar/25: [~accountid:712020:6ad09b37-0830-44f3-a3a0-09cf116d5532] This issue is resolved in Dev server. Please check once. !image-20250318-120130.png|width=965,height=611,alt="image-20250318-120130.png"!
- 19/Mar/25: !image-20250319-021512.png|width=1366,height=768,alt="image-20250319-021512.png"!
- 19/Mar/25: Issue has been fixed and code has been updated on Development server. Tested and Verified with Chrome browser. Functionality is working fine. Development URL->[http://127.0.0.1/admin/|http://127.0.0.1/admin/]

**Source metadata:** priority=Medium · status=Done · resolution=Done · resolved=19/Mar/25 7:47 AM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-015 (CPI-179)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-016 — CPI-382 · _Mismatch of ERP Attributes Between New NPI Creation and Post-Publish View_

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-911`
- environment: `prod-iksula`
- durationMs: 2050

**Source description:**

> _Description:_ As per the attribute mapping sheet provided by the client, the ERP form should display consistent attributes in both the New NPI creation phase and after the product is published. However, after publishing the product and enabling _"New item code creation"_, the ERP form displays additional unexpected attributes. Specifically, _five extra fields_ are visible post-publish that were not required to be shown. _Steps to Reproduce:_ # Go to _NPI section_ in the PIMCore Admin. # Start creating a _New NPI_. # Observe the ERP attribute fields displayed during the creation phase. # Publish the product. # Click on the checkbox for _"New item code creation"_. # Observe that _5 extra attributes_ appear in the ERP section which are not defined as per the client-provided attribute sheet.…

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 15/Jul/25: \* All the attributes should be visible after a new NPI created in the ERP tab. No need to click on the Checkbox. [screenshot elided]
- 17/Jul/25: Done on Dev and Uat
- 18/Jul/25: All the attributes are visible after a new NPI created in the ERP tab. [screenshot elided]
- 18/Jul/25: _No 5 extra attributes_ appear in the ERP section. [screenshot elided]
- 30/Sep/25: In Production, _No 5 extra attributes_ appear in the ERP section. [screenshot elided]

**Source metadata:** priority=High (migrated) · status=Done · resolution=Done · resolved=30/Sep/25 12:22 PM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-016 (CPI-382)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-017 — CPI-251 · _Issue in Bulk import with 2000 records and excel file is not to be uploaded_

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-912`
- environment: `prod-iksula`
- durationMs: 9825

**Source description:**

> Issue in Bulk import with 2000 records and excel file is not to be uploaded 1.Go to URL 2.[http://127.0.0.1/admin/|http://127.0.0.1/admin/] 3.Enter valid login credentials 4.Go to menu list and click on Bulk import 5.select excel file and click on upload button. 6.After clicking on upload button,file is continuous processing and 0 to 100 percen be shown and continuos running. 7.I was waiting approx 5 minuts but its not be uplo Expected Result->After clicking the uploaded file,file should be successfully uploaded. Actual result: For 2000 records,file is not to be uploaded.

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 15/Apr/25: [~accountid:712020:6ad09b37-0830-44f3-a3a0-09cf116d5532] Tested with 4000 records working on Uat, More that this getting Memory Issue on Uat.
- 15/Apr/25: [~accountid:712020:6ad09b37-0830-44f3-a3a0-09cf116d5532] Done to update with 5000 records bulk import process on Uat, need to check with more records on Uat.
- 23/Apr/25: [~accountid:712020:6ad09b37-0830-44f3-a3a0-09cf116d5532] on 7000 bulk import process it takes, 25-30 mins approximate.
- 02/May/25: [~accountid:712020:6ad09b37-0830-44f3-a3a0-09cf116d5532] for 6500 bulk import process, it takes 12 mins approximate.
- 10/Jul/25: As we testing with given client Data working fine on Uat. Click can provided only two PMG’s data, updated on Uat, remaining PMG’s data are not provided by client end.

**Source metadata:** priority=High (migrated) · status=Done · resolution=Done · resolved=10/Jul/25 12:57 PM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-017 (CPI-251)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-018 — CPI-342 · _For admin, all tabs should be visible & editable_

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-913`
- environment: `local-dev`
- durationMs: 11190

**Source description:**

> For admin, all tabs should be visible & editable

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 25/Jun/25: In Admin user, Product only show the ERP and DAM Tab. Now DAM tab is disable and Not required tabs are visible. [screenshot elided]
- 26/Jun/25: Admin have allow all access to check and verify all data added by other Users, for that reason allow all access to Admin.
- 26/Jun/25: [~accountid:712020:12a0993c-2b54-48f2-9527-9d90d5db0a2c] In Admin user, Product are show the ERP and DAM Tab. Now it Showing as Expected. [screenshot elided] [screenshot elided] [screenshot elided]

**Source metadata:** priority=Highest · status=Done · resolution=Done · resolved=16/Sep/25 4:10 PM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-018 (CPI-342)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-019 — CPI-375 · _Update Marketing Head Product Approval Email Template_

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-914`
- environment: `local-dev`
- durationMs: 4228

**Source description:**

> This functionality will be developed in Phase 2. h3. _Description:_ _Objective:_ Modify the email template that is sent to the Marketing Head during Product Approval. _Requirements:_ # _Remove the following line_ from the current email template: _"Post approval, please send 'Product Name' to 'Next Role' for review."_ # _Create a new email template_ that does _not include_ the above line. # The updated email template should be triggered _only when a product is in the approval workflow_ and should be sent _exclusively to the Marketing Head_. _Scope:_ _ Applicable only for Product Approval stage. _ Affects email notifications received by the Marketing Head role. !Screenshot 2025-07-04 at 5.01.58 PM.png|width=1107,height=641,alt="Screenshot 2025-07-04 at 5.01.58 PM.png"!

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 01/Aug/25: \* [~accountid:712020:edb6975e-6657-4571-a61c-9d16c7ba2a83] The solution and code have been provided to [~accountid:712020:12a0993c-2b54-48f2-9527-9d90d5db0a2c] . Proceeding to assign the ticket to him. Create a new template according to Marketing Head and changed the template name in line no 240 !image (15).png|width=668,height=248,alt="image (15).png"!
- 01/Aug/25: Done on Dev and UAT. Create New Template: “In-Review-MarketingHead“ and completed functionality. [screenshot elided]
- 04/Aug/25: Check in email send to Marketing Head in both scenarios like in normal Product workflow and Reopen product workflow as well. [screenshot elided]

**Source metadata:** priority=High (migrated) · status=Done · resolution=Done · resolved=16/Sep/25 5:30 PM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-019 (CPI-375)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-020 — CPI-403 · _Email shows incorrect line after DAM Manager approval – Product Manager reference not required_

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-915`
- environment: `staging-iksula`
- durationMs: 4277

**Source description:**

> _Environment: Prod_ * Workflow: Marketing Manager → DAM Manager → Publish to Web *Steps to Reproduce:* # Marketing Manager approves an product and sends it to *DAM Manager*. # DAM Manager receives the approval email notification. # Observe the content of the mail. *Expected Result:\* _ Email should only instruct the DAM Manager to review and publish the product. _ No further steps or Product Manager reference should be included. _Actual Result:_ _ Email incorrectly contains the line: _"Post approval please send ALO RESIN SANDER DISC test to 'Product Manager' for review."\* * This is misleading because once DAM Manager approves, the product is directly *Published to Web*. *Impact:\* \* Causes workflow confusion by wrongly suggesting Product Manager involvement after DAM Manager approval.…

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 12/Sep/25: What correct Template content needs to send, pls write in tickets.
- 12/Sep/25: It is “In-Review“ Product Template, once done changes it affected on every “In-Review“ Product. Pls confirm with client, if yes then change it.
- 12/Sep/25: It is “In-Review“ Product Template, once done changes it affected on every “In-Review“ Product. Pls confirm with client, if yes then change it.
- 08/Oct/25: Done and updated on UAT and PROD Server.
- 27/Oct/25: The Line from Mail "Post approval please send ProductName to 'Product Manager' for review." _is removed._ [screenshot elided]

**Source metadata:** priority=Medium · status=Done · resolution=Done · resolved=27/Oct/25 7:31 PM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-020 (CPI-403)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-021 — CPI-352 · _In newly created SKU, in ERP form for ERP support team all details should get fetched like SAG etc. , previous item codes should be disabled_

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-916`
- environment: `prod-iksula`
- durationMs: 4386

**Source description:**

> In newly created SKU, in ERP form for ERP support team all details should get fetched like SAG etc. , previous item codes should be disabled

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 11/Jul/25: # In ERP form, As the ERP support team select the PIM ID. Automatically all details of selected PIM ID get fetched like SAG etc. # In the item Description List section, Old item codes is disabled and ERP support team can able to add the New item code for Newly created SKU. [screenshot elided] [screenshot elided]
- 12/Nov/25: Works as expected [screenshot elided] [screenshot elided]

**Source metadata:** priority=Highest · status=Done · resolution=Done · resolved=12/Nov/25 1:15 PM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-021 (CPI-352)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-022 — CPI-248 · _Error popup while click on Bonded and coded folder and their inner folder_

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-917`
- environment: `local-dev`
- durationMs: 8629

**Source description:**

> !Screenshot from 2025-04-07 11-19-37.png|width=1920,height=1080,alt="Screenshot from 2025-04-07 11-19-37.png"!

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 09/Apr/25: !image-20250409-042454.png|width=1366,height=768,alt="image-20250409-042454.png"! !image-20250409-042421.png|width=50%,alt="image-20250409-042421.png"! !image-20250409-042346.png|width=1366,height=768,alt="image-20250409-042346.png"! !image-20250409-042312.png|width=50%,alt="image-20250409-042312.png"! !image-20250409-042239.png|width=1366,height=768,alt="image-20250409-042239.png"! !image-20250409-042143.png|width=1366,height=768,alt="image-20250409-042143.png"!
- 09/Apr/25: Issue fixed and Code has been updated on Development server. Tested and Verified with Chrome browser. Functionality is working fine. Development URL->[http://127.0.0.1/admin/|http://127.0.0.1/admin/]

**Source metadata:** priority=Minor · status=Done · resolution=Done · resolved=09/Apr/25 9:56 AM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-022 (CPI-248)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-023 — CPI-292 · _Rename Sub Brand to Brand Extension_

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-918`
- environment: `staging-iksula`
- durationMs: 11704

**Source description:**

> !image-20250415-101404.png|width=1070,height=530,alt="image-20250415-101404.png"! rename folder and title of ht sub brand name and check the impact as well

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 15/Apr/25: We are using Sub Brand Object, we can not change it, that’s why we are not replace folder name itself. Because of both needs same name. On PMG template we have updated and accordingly on Product class replace with Brand Extension name.
- 18/Apr/25: It is not possible, because of once create new Object it consider as same name of Folder and it stored in it.
- 22/Apr/25: Once create single object of Sub Brand it always stored in SubBrand folder.
- 23/Apr/25: Done on Dev and Uat itself. [screenshot elided]

**Source metadata:** priority=Minor · status=Done · resolution=Done · resolved=02/May/25 12:51 PM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-023 (CPI-292)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-024 — CPI-293 · _Security Risk in Product API, without authorization data is coming_

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-919`
- environment: `staging-iksula`
- durationMs: 9728

**Source description:**

> !image-20250415-115254.png|width=1591,height=811,alt="image-20250415-115254.png"!

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 15/Apr/25: We are not integrated any server authentication process on client server. Let we check and confirm it.
- 16/Apr/25: Done to update on Dev with Authentication: !image-20250416-141549.png|width=1366,height=768,alt="image-20250416-141549.png"!
- 18/Apr/25: tested on UAT , working fine !image-20250418-074930.png|width=1048,height=430,alt="image-20250418-074930.png"! !image-20250418-075010.png|width=1048,height=950,alt="image-20250418-075010.png"!
- 22/Apr/25: Done with Authorisation: Bearer Token and updated on Dev and Uat itself.

**Source metadata:** priority=Major · status=Done · resolution=Done · resolved=22/Apr/25 1:10 PM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-024 (CPI-293)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-025 — CPI-243 · _Issue in Bulk import and excel file is not to be uploaded_

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-920`
- environment: `prod-iksula`
- durationMs: 10279

**Source description:**

> Issue in Bulk import and excel file is not to be uploaded 1.Go to URL 2.[http://127.0.0.1/admin/|http://127.0.0.1/admin/] 3.Enter valid login credentials 4.Go to menu list and click on Bulk import 5.select excel file and click on upload button. 6.After clicking on upload button,message is showing invalid file format(only excel file uploaded) 7.Now uplaoding exdel file but its not to be uplaoded Expected Result->After clicking the uploaded file,file should be successfully uploaded. Actual result: excel file is not to be uploaded and message is showing invalid file format(only excel file uploaded) Note: File has been uploaded 100 percent then again start from 0 percent and message is showing, invalid file format and file is not to be uploaded.

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 02/Apr/25: !image-20250402-101534.png|width=1366,height=768,alt="image-20250402-101534.png"! !image-20250402-101608.png|width=1366,height=768,alt="image-20250402-101608.png"!
- 04/Apr/25: [~accountid:712020:12a0993c-2b54-48f2-9527-9d90d5db0a2c] Now file has been successfully but after uploading the excel file.message is showing 4 times 0 to 100 pecent and agaon same message is showing 0 to 100 pertcent. Its not a blocker but according to your availability,you can check from your end.
- 22/Apr/25: Done to resolved on Dev and Uat.

**Source metadata:** priority=Medium · status=Done · resolution=Done · resolved=22/Apr/25 2:47 PM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-025 (CPI-243)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-026 — CPI-405 · _Reopen Product Workflow Fails – Email Error & Conflicting Statuses_

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-921`
- environment: `prod-iksula`
- durationMs: 4880

**Source description:**

> _Description:_ When the Product Manager attempts to reopen a product workflow, multiple issues are occurring: # On first attempt of _Action > Reopen product workflow_, the system throws an error: {noformat}error performing action on this element Workflow processing error: Email sending failed: Email template path is empty! {noformat} # On retrying _Action > Reopen product workflow_, another error appears: {noformat}transition failed The marking does not enable the transition {noformat} # After the above errors, under the _Action_ menu, the _Reopen product workflow_ option is no longer visible and the _Approve_ button is also missing. # If the user proceeds with approving the product again, the workflow incorrectly displays _two statuses simultaneously_: #_ *InReview* #_ \_Product Data…

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 16/Sep/25: Resolved Workflow Template issue. Pls check once.
- 12/Nov/25: After Reopen the product, it work as expected no any Error are shown and Product shows the status as “New”. In the Action button, Data enrichment Done button is showing. [screenshot elided] [screenshot elided] [screenshot elided]

**Source metadata:** priority=High (migrated) · status=Done · resolution=Done · resolved=12/Nov/25 12:38 PM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-026 (CPI-405)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-027 — CPI-194 · _Login from Product head,approve/reject options are not be visible._

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-922`
- environment: `staging-iksula`
- durationMs: 11138

**Source description:**

> Login from Product head,approve/reject options are not be visible.

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 17/Mar/25: [~accountid:712020:6ad09b37-0830-44f3-a3a0-09cf116d5532] please add screnshot or add descrption to reproduce issue
- 17/Mar/25: [~accountid:712020:6ad09b37-0830-44f3-a3a0-09cf116d5532] please add description/PIMID or screenshot
- 19/Mar/25: Code has been updated on Development server. Tested and Verified with Chrome browser. Functionality is working fine. Development URL->[http://127.0.0.1/admin/|http://127.0.0.1/admin/]

**Source metadata:** priority=Minor · status=Done · resolution=Done · resolved=19/Mar/25 8:30 AM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-027 (CPI-194)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-028 — CPI-178 · _User Module->After clicking on Email invitation link, found exception error._

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-923`
- environment: `local-dev`
- durationMs: 10399

**Source description:**

> User Module->After clicking on Email invitation link, found exception error. Steps to be replicate: 1.Go to URL 2.[Http://127.0.0.1:8080/Admin|Http://127.0.0.1:8080/Admin] 3.Enter valid login credentials 4.Go to users 5.Click on product head 6.Enter email id and click on send invitation link 7.After clicking on send invitation link then found exception error. Expected Result: After clicking on send invitation link,its should be work and receive email with correct ID Actual Result: After clicking on Email invitation link,found exception error.

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 10/Mar/25: !image-20250310-063555.png|width=1366,height=768,alt="image-20250310-063555.png"!
- 21/Mar/25: This issue has reolved !image-20250321-091941.png|width=894,height=515,alt="image-20250321-091941.png"!
- 28/Mar/25: Code has been updated on Development server. Tested and Verified with Chrome browser. Functionality is working fine. Development URL->[http://127.0.0.1/admin/|http://127.0.0.1/admin/]

**Source metadata:** priority=Medium · status=Done · resolution=Done · resolved=28/Mar/25 10:36 AM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-028 (CPI-178)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-029 — CPI-244 · _Issue in Assets->JPG upload functionality_

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-924`
- environment: `local-dev`
- durationMs: 9042

**Source description:**

> Issue in Assets->JPG upload functionality 1.Go to URL 2.[http://127.0.0.1/admin/|http://127.0.0.1/admin/] 3.Enter valid login credentials with admin 4.Go to menu list and click on Assets 5.Go to Product Image 6.Right click and upload JPG image 7.select JPG file and Upload JPG file format 8.After uploading JPG file,file is not to be uploaded. 9.Message is showing-only ,xls file is only allowed. Expected Result-> JPG file should be uploaded Actual Result->After uploading JPG file,file is not to be uploaded.

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 03/Apr/25: !image-20250403-090121.png|width=1366,height=768,alt="image-20250403-090121.png"! !image-20250403-090049.png|width=1366,height=768,alt="image-20250403-090049.png"!
- 03/Apr/25: Resolved on Dev
- 11/Apr/25: Code has been updated on Development server. Tested and Verified with Chrome browser. Functionality is working fine. Development URL->[http://127.0.0.1/admin/|http://127.0.0.1/admin/]

**Source metadata:** priority=Highest · status=Done · resolution=Done · resolved=11/Apr/25 5:05 PM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-029 (CPI-244)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-030 — CPI-177 · _Masters->After Search functionality is not working with ID, path and date_

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-925`
- environment: `local-dev`
- durationMs: 6526

**Source description:**

> Masters->After Search functionality is not working with ID, path and date Steps to be replicate: 1.Go to URL 2.[Http://127.0.0.1:8080/Admin|Http://127.0.0.1:8080/Admin] 3.Enter valid login credentials 4.Click on data objects 5.Go to Masters 6.Click on Brands 7.Go to search 8.Search functionality is not working with ID,path and date Expected Result: Search functionality should be work with ID,date and other fields. Actual Result: Search functionality is not working with ID and path

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 28/Mar/25: !image-20250328-063708.png|width=1366,height=768,alt="image-20250328-063708.png"! !image-20250328-063639.png|width=1366,height=768,alt="image-20250328-063639.png"!
- 28/Mar/25: [~accountid:712020:6ad09b37-0830-44f3-a3a0-09cf116d5532] this is default pimcore feature. It searches based on the text not number . Please verify in pimcore default website [https://demo.pimcore.fun/admin/|https://demo.pimcore.fun/admin/]

**Source metadata:** priority=Medium · status=Done · resolution=Done · resolved=11/Apr/25 5:03 PM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-030 (CPI-177)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-031 — CPI-187 · _Dam workflow->All 15 PMG are not available in permission bundle._

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-926`
- environment: `local-dev`
- durationMs: 9785

**Source description:**

> Dam workflow->All 15 PMG are not available in permission bundle.

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 17/Mar/25: [~accountid:712020:6ad09b37-0830-44f3-a3a0-09cf116d5532] Please save and publish all object of PMG from PMG master
- 19/Mar/25: !image-20250319-024338.png|width=1366,height=768,alt="image-20250319-024338.png"!
- 19/Mar/25: Tested and Verified with Chrome browser. Functionality is working fine. Development URL->[http://127.0.0.1/admin/|http://127.0.0.1/admin/]

**Source metadata:** priority=Minor · status=Done · resolution=Done · resolved=19/Mar/25 8:14 AM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-031 (CPI-187)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-032 — CPI-250 · _Action button is not visible in role ProductHeadIndustrial and ProductHeadRetail in Product Workflow_

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-927`
- environment: `staging-iksula`
- durationMs: 2008

**Source description:**

> !image-20250409-112932.png|width=1366,height=768,alt="image-20250409-112932.png"!

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 09/Apr/25: action button is visible->Product head retail-> !image-20250409-104330.png|width=1366,height=768,alt="image-20250409-104330.png"!
- 09/Apr/25: action button is visible for Product head industrial-> !image-20250409-111410.png|width=1366,height=768,alt="image-20250409-111410.png"!
- 09/Apr/25: Tested and verified in Dev environment. Its working fine.

**Source metadata:** priority=Minor · status=Done · resolution=Done · resolved=09/Apr/25 4:47 PM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-032 (CPI-250)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-033 — CPI-241 · _Issue in Export functionality(Search and export)_

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-928`
- environment: `local-dev`
- durationMs: 11098

**Source description:**

> Issue in Export functionality 1.Go to URL 2.[http://127.0.0.1/admin/|http://127.0.0.1/admin/] 3.Enter valid login credentials 4.Go to menu list and click on search and export icon 5.Go to vertical and select Retail 6.Click on search button 7.Here 300 records are showing 8.Click on export button 9.after clicking on export button, only 10 records are showing Expected Result->After clicking on export button, all records should be shown in the grid. Actual result: After clicking on export button, only 10 records are showing and records are showing page wise !image-20250402-084508.png|width=1366,height=768,alt="image-20250402-084508.png"!

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 02/Apr/25: !image-20250402-084755.png|width=1366,height=768,alt="image-20250402-084755.png"! !image-20250402-084847.png|width=1366,height=768,alt="image-20250402-084847.png"!
- 14/Apr/25: Code has been updated on Development server. Tested and Verified with Chrome browser. Functionality is working fine. Development URL->[http://127.0.0.1/admin/|http://127.0.0.1/admin/]

**Source metadata:** priority=Medium · status=Done · resolution=Done · resolved=14/Apr/25 5:19 AM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-033 (CPI-241)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-034 — CPI-346 · _In Notification, it is showing as product manager instead of product head, but mail is going to product head only_

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-929`
- environment: `local-dev`
- durationMs: 5826

**Source description:**

> In Notification, it is showing as product manager instead of product head, but mail is going to product head only

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 25/Jun/25: [~accountid:712020:6dbf8ce9-e3d4-4f0e-b6fa-4159f0beb285] That was previous notification sent by product manger to marketing manger, when action has taken by marketing manager then notification will display to product head user only not marketing maneger. There was misunderstanding in meeting.
- 25/Jun/25: Notification and Product WorkFlow Work as Expected

**Source metadata:** priority=Highest · status=Done · resolution=Done · resolved=19/Sep/25 10:57 AM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-034 (CPI-346)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-035 — CPI-291 · _Wrong message after upload in SAG, Brand and Brand extension_

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-930`
- environment: `local-dev`
- durationMs: 8046

**Source description:**

> It should be “Brand data has been imported successfully. Please check logs “Assets/BrandLogs“ for more error and success details !image-20250415-100917.png|width=480,height=270,alt="image-20250415-100917.png"! !image-20250415-101735.png|width=1070,height=530,alt="image-20250415-101735.png"!

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 15/Apr/25: Done on localhost, for SAG, Brand and Brand Extension message. [screenshot elided]
- 16/Apr/25: Done on Dev and Uat with message changes.
- 18/Apr/25: tested on UAT !image-20250418-075849.png|width=1048,height=212,alt="image-20250418-075849.png"!

**Source metadata:** priority=Minor · status=Done · resolution=Done · resolved=22/Apr/25 1:09 PM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-035 (CPI-291)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-036 — CPI-190 · _After login from marketing head,found exception after click on save button.Its not be working properly._

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-931`
- environment: `local-dev`
- durationMs: 11045

**Source description:**

> After login from marketing head, found exception after click on save button. Its not be working properly.

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 17/Mar/25: [~accountid:712020:6ad09b37-0830-44f3-a3a0-09cf116d5532] Please add proper screen shots to recreate issue in my local. I am assigning re back to you.
- 19/Mar/25: Code has been updated on Development server. Tested and Verified with Chrome browser. Functionality is working fine. Development URL->[http://127.0.0.1/admin/|http://127.0.0.1/admin/]

**Source metadata:** priority=Minor · status=Done · resolution=Done · resolved=19/Mar/25 8:24 AM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-036 (CPI-190)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-037 — CPI-192 · _Mandatory fields should be \* and red mark in Page-ERP,Information material,Technical,DAM,SCM,SCO,Quality Summary._

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-932`
- environment: `local-dev`
- durationMs: 4953

**Source description:**

> Mandatory fields should be \* and red mark in Page-ERP,Information material,Technical,DAM,SCM,SCO,Quality Summary.

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 17/Mar/25: [~accountid:712020:6ad09b37-0830-44f3-a3a0-09cf116d5532] Please add proper screen shot here to recheck in my local. I am reassigning issue to you.
- 28/Mar/25: Code has been updated on Development server. Tested and Verified with Chrome browser. Functionality is working fine. Development URL->[http://127.0.0.1/admin/|http://127.0.0.1/admin/]

**Source metadata:** priority=Minor · status=Done · resolution=Done · resolved=28/Mar/25 10:38 AM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-037 (CPI-192)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-038 — CPI-252 · _Issue in ERP form and file is not be uploaded_

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-933`
- environment: `staging-iksula`
- durationMs: 11004

**Source description:**

> Issue in ERP form and file is not be uploaded 1.Go to URL 2.Login from ERP support 3.[http://127.0.0.1/admin/|http://127.0.0.1/admin/] 4.Enter valid login credentials 5.Go to menu list and click on ERP form 6.ERP form page should be open 5.Select PIM id and fill all the detaisl 6.uplad the excel file 7.File is not to be uplaoded then found exception error Expected Result->After uploading the file, file should be uploaded. Actual result: File is not to be uploaded then found exception error !image-20250408-091748.png|width=512,height=288,alt="image-20250408-091748.png"! !image-20250408-091726.png|width=1366,height=768,alt="image-20250408-091726.png"!

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 09/Apr/25: [~accountid:712020:6ad09b37-0830-44f3-a3a0-09cf116d5532] Please click on that link u can find out detail errors in separate new tab.
- 11/Apr/25: Code has been updated on Development server. Tested and Verified with Chrome browser. Functionality is working fine. Development URL->[http://127.0.0.1/admin/|http://127.0.0.1/admin/]

**Source metadata:** priority=Highest · status=Done · resolution=Done · resolved=11/Apr/25 7:07 AM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-038 (CPI-252)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-039 — CPI-249 · _Email is not sending to ProductHeadIndustrial and ProductHeadRetila in Product Workflow_

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-934`
- environment: `prod-iksula`
- durationMs: 6978

**Source description:**

> !image-20250409-113017.png|width=1366,height=768,alt="image-20250409-113017.png"!

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 09/Apr/25: Email received-> !image-20250409-104520.png|width=1366,height=768,alt="image-20250409-104520.png"!
- 09/Apr/25: Email received !image-20250409-111216.png|width=1366,height=768,alt="image-20250409-111216.png"!
- 09/Apr/25: Tested and verified on dev environment. Its working fine.

**Source metadata:** priority=Minor · status=Done · resolution=Done · resolved=09/Apr/25 5:02 PM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-039 (CPI-249)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-040 — CPI-191 · _ERP form,its not working correctly._

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-935`
- environment: `prod-iksula`
- durationMs: 5974

**Source description:**

> ERP form,its not working correctly.

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 19/Mar/25: !image-20250319-024547.png|width=1366,height=768,alt="image-20250319-024547.png"!
- 19/Mar/25: Issue has been fixed and code has been updated on Development server. Tested and Verified with Chrome browser. Functionality is working fine. Development URL->[http://127.0.0.1/admin/|http://127.0.0.1/admin/]

**Source metadata:** priority=Medium · status=Done · resolution=Done · resolved=19/Mar/25 8:16 AM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-040 (CPI-191)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-041 — CPI-181 · _After creating the product,By default SAG code is not showing._

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-936`
- environment: `staging-iksula`
- durationMs: 9476

**Source description:**

> After creating the product,By default SAG code is not showing.

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 19/Mar/25: !image-20250319-022839.png|width=1366,height=768,alt="image-20250319-022839.png"!
- 19/Mar/25: Issue has been fixed and code has been updated on Development server. Tested and Verified with Chrome browser. Functionality is working fine. Development URL->[http://127.0.0.1/admin/|http://127.0.0.1/admin/]

**Source metadata:** priority=Minor · status=Done · resolution=Done · resolved=19/Mar/25 7:59 AM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-041 (CPI-181)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-042 — CPI-180 · _After creating the product,By default PMG code is not showing._

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-937`
- environment: `prod-iksula`
- durationMs: 8193

**Source description:**

> After creating the product,By default PMG code is not showing.

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 19/Mar/25: !image-20250319-022616.png|width=1366,height=768,alt="image-20250319-022616.png"!
- 19/Mar/25: Issue has been fixed and code has been updated on Development server. Tested and Verified with Chrome browser. Functionality is working fine. Development URL->[http://127.0.0.1/admin/|http://127.0.0.1/admin/]

**Source metadata:** priority=Medium · status=Done · resolution=Done · resolved=19/Mar/25 7:57 AM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-042 (CPI-180)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-043 — CPI-353 · _Item code needs to be removed from PDF_

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-938`
- environment: `local-dev`
- durationMs: 10824

**Source description:**

> Item code needs to be removed from PDF

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 26/Jun/25: Item code are removed from PDF successfully. [screenshot elided] [screenshot elided]
- 10/Jul/25: Done on Dev and Uat.

**Source metadata:** priority=Highest · status=Done · resolution=Done · resolved=10/Jul/25 1:00 PM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-043 (CPI-353)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-044 — CPI-188 · _For change management workflow - Product manager can do the changes and approve/reject._

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-939`
- environment: `prod-iksula`
- durationMs: 2383

**Source description:**

> For change management workflow - Product manager can do the changes and approve/reject.

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 17/Mar/25: [~accountid:712020:6ad09b37-0830-44f3-a3a0-09cf116d5532] Please mentione PIM ID or screenshot
- 19/Mar/25: Code has been updated on Development server. Tested and Verified with Chrome browser. Functionality is working fine. Development URL->[http://127.0.0.1/admin/|http://127.0.0.1/admin/]

**Source metadata:** priority=Minor · status=Done · resolution=Done · resolved=19/Mar/25 8:22 AM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-044 (CPI-188)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-045 — CPI-356 · _Rename Product manager instead of Project Manager_

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-940`
- environment: `prod-iksula`
- durationMs: 11468

**Source description:**

> Rename Product manager instead of Project Manager

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 25/Jun/25: In the Both Product Head and Marketing Head User, Product manager are showing in the Action button Dropdown. [screenshot elided] [screenshot elided]

**Source metadata:** priority=Highest · status=Done · resolution=Done · resolved=12/Sep/25 8:14 PM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-045 (CPI-356)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-046 — CPI-193 · _After login from product Manager,Uploaded Image is not be shown during product Manager login._

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-941`
- environment: `staging-iksula`
- durationMs: 4789

**Source description:**

> After login from product Manager, Uploaded Image is not be shown during product Manager login.

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 17/Mar/25: [~accountid:712020:6ad09b37-0830-44f3-a3a0-09cf116d5532] please provide screenshot
- 19/Mar/25: Code has been updated on Development server. Tested and Verified with Chrome browser. Functionality is working fine. Development URL->[http://127.0.0.1/admin/|http://127.0.0.1/admin/]

**Source metadata:** priority=Minor · status=Done · resolution=Done · resolved=19/Mar/25 8:29 AM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-046 (CPI-193)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-047 — CPI-253 · _Bulk Publish button is only visible for DAM manager or admin in Products/BONDED/ and Products/COATED/ folder_

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-942`
- environment: `local-dev`
- durationMs: 8150

**Source description:**

> (no description in source ticket)

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 09/Apr/25: !image-20250409-100724.png|width=1366,height=768,alt="image-20250409-100724.png"! !image-20250409-100657.png|width=1366,height=768,alt="image-20250409-100657.png"!
- 09/Apr/25: !image-20250409-122529.png|width=1366,height=768,alt="image-20250409-122529.png"! !image-20250409-122503.png|width=50%,alt="image-20250409-122503.png"! !image-20250409-122132.png|width=1366,height=768,alt="image-20250409-122132.png"!
- 09/Apr/25: !image-20250409-130239.png|width=1366,height=768,alt="image-20250409-130239.png"! !image-20250409-130112.png|width=1366,height=768,alt="image-20250409-130112.png"!
- 09/Apr/25: Issue fixed and Code has been updated on Development server. Tested and Verified with Chrome browser. Functionality is working fine. Development URL->[http://127.0.0.1/admin/|http://127.0.0.1/admin/]

**Source metadata:** priority=Minor · status=Done · resolution=Done · resolved=09/Apr/25 7:03 PM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-047 (CPI-253)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-048 — CPI-366 · _After ERP Approved the Product, If user click on DAM Tab then ERP tab can't be clickable in all the User._

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-943`
- environment: `staging-iksula`
- durationMs: 8824

**Source description:**

> (no description in source ticket)

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 25/Jun/25: User _can’t go back_ to ERP after switching away, because disabled so not possible to clickable of ERP tab.
- 26/Jun/25: Step to reproduce 1. Open any User and open the product which is Approved. # in the Product ERP and DAM tab is Showing. # Click on DAM tab. # As the DAM tab is open. Try to click on the ERP tab. it cant be clickable. If user want to see the information in the ERP tab then they need to Reload the Page. So, ERP & DAM tab should be clickable and Information in the tabs are visible.
- 11/Jul/25: other user have this issue still pending, But In the Product manager & Admin works properly.
- 21/Jul/25: Done on Dev and UAT.
- 22/Jul/25: All the user can click on the ERP & DAM tab and Information in the tabs are visible.

**Source metadata:** priority=Medium · status=Done · resolution=Done · resolved=30/Sep/25 12:05 PM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-048 (CPI-366)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-049 — CPI-394 · _Rename the "Update" button to "Update to DAM Manager" in the DAM workflow_

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-944`
- environment: `local-dev`
- durationMs: 1886

**Source description:**

> (no description in source ticket)

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 01/Aug/25: [~accountid:712020:edb6975e-6657-4571-a61c-9d16c7ba2a83] The solution and code have been provided to [~accountid:712020:12a0993c-2b54-48f2-9527-9d90d5db0a2c] . Proceeding to assign the ticket to him
- 01/Aug/25: Done on Dev and UAT.
- 04/Aug/25: In the DAM workFlow, In the Action dropdown “Update to DAM Manager” are showing in the product manager, product head and Marketing manager. [screenshot elided] [screenshot elided] [screenshot elided]

**Source metadata:** priority=Medium · status=Done · resolution=Done · resolved=07/Oct/25 12:37 PM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-049 (CPI-394)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

## def-050 — CPI-362 · _New NPI > ERP > Objective Others : Extra field is Showing._

**Synthesized fields (mechanical port — do NOT edit):**

- testCaseId: `TC-RET-945`
- environment: `prod-iksula`
- durationMs: 5480

**Source description:**

> (no description in source ticket)

**Source recent_comments (cleaned — ADF + account-ID noise stripped):**

- 25/Jun/25: As per requirements added new fields.
- 26/Jun/25: In the Brand/ product objective Field Have an DropDown. DropDown contains _ Portfolio Expansion, _ Cost Optimization, _ Product upgrade /innovation, _ New segment/market entry, _ Customer request, _ If others (Added the Other Objective Field with text box) [screenshot elided]
- 10/Jul/25: Done on Dev and Uat.
- 11/Jul/25: Its Working as expected

**Source metadata:** priority=Medium · status=Done · resolution=Done · resolved=15/Sep/25 7:18 PM

**👉 GROUND TRUTH — fill this YAML block:**

```yaml
# def-050 (CPI-362)
rootCauseCategory: '' # one of: code-bug | data-bug | env-config | flaky-network | auth-permissions | dependency-version | ui-regression | race-condition | payment-gateway | other
rootCauseDetail: '' # 1-2 sentences explaining the actual cause (≥10 chars)
acceptableAlternatives: [] # other category enums a senior reviewer could defend; typically 1-2
confidence: '' # high / medium / low — your confidence in this label
notesForEval: '' # comments for the eval reviewer (e.g., "ambiguous because…")
```

---

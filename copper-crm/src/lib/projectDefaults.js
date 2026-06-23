export const PROJECT_TEMPLATES = {
  "Logo Design": [
    "Requirements",
    "Research",
    "Concept Sketches",
    "Typography",
    "Logo Design",
    "Client Review",
    "Final Delivery"
  ],
  "Website": [
    "Requirements",
    "Wireframes",
    "UI Design",
    "Development",
    "Testing",
    "Deployment"
  ],
  "SEO": [
    "Requirements",
    "Keyword Research",
    "On-Page SEO",
    "Technical SEO",
    "Reporting"
  ],
  "Custom": [
    "Phase 1",
    "Phase 2",
    "Delivery"
  ]
};

function addDays(value, days) {
  const base = value ? new Date(value) : new Date();
  if (Number.isNaN(base.getTime())) return "";
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

export function buildProjectPayload(form, company) {
  const projectId = `project-${Date.now()}`;
  
  // Base off selected template
  const templateName = form.template || "Custom";
  const stageNames = PROJECT_TEMPLATES[templateName] || PROJECT_TEMPLATES["Custom"];
  
  const stages = stageNames.map((name, i) => {
    // Spread the dates somewhat sequentially as default
    const startDate = addDays(form.startDate, i * 5);
    const endDate = addDays(form.startDate, (i * 5) + 4);
    
    return {
      id: `stage-${Date.now()}-${i}`,
      name,
      status: "not_started",
      startDate,
      endDate,
      notes: ""
    };
  });

  const payload = {
    ...form,
    id: projectId,
    projectId: form.projectCode || projectId,
    companyId: company._id || company.id,
    companyName: company.name,
    client: company.name,
    budget: Number(form.budget) || 0,
    packageValue: Number(form.budget) || 0,
    discountApplied: Number(form.discount) || 0,
    finalAmount: Number(form.finalAmount) || Math.max(Number(form.budget || 0) - Number(form.discount || 0), 0),
    linkedInvoiceId: form.linkedInvoiceId,
    budgetUsed: 0,
    progress: 0,
    stages,
    template: templateName,
    tasksBoard: ["To Do", "In Progress", "Review", "Done"],
    documents: [],
    customFolders: [],
    activity: [
      { icon: "check", text: "Project workspace created", time: "Just now" },
    ],
    history: [
      { event: "Project Created", createdAt: new Date().toISOString() },
    ],
    createdAt: new Date().toISOString(),
  };

  return { payload, starterTasks: [] };
}

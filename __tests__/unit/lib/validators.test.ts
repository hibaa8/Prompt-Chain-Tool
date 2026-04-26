import {
  createHumorFlavorSchema,
  updateHumorFlavorSchema,
  duplicateHumorFlavorSchema,
  createHumorFlavorStepSchema,
  updateHumorFlavorStepSchema,
  reorderStepSchema,
} from "@/lib/validators";

describe("createHumorFlavorSchema", () => {
  it("accepts a valid name", () => {
    const result = createHumorFlavorSchema.safeParse({ name: "Dry Wit" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Dry Wit");
  });

  it("accepts name with optional description", () => {
    const result = createHumorFlavorSchema.safeParse({
      name: "Dry Wit",
      description: "Very dry humor",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createHumorFlavorSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing name", () => {
    const result = createHumorFlavorSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects non-string name", () => {
    const result = createHumorFlavorSchema.safeParse({ name: 42 });
    expect(result.success).toBe(false);
  });
});

describe("updateHumorFlavorSchema", () => {
  it("is identical to createHumorFlavorSchema (same shape)", () => {
    const create = createHumorFlavorSchema.safeParse({ name: "Test" });
    const update = updateHumorFlavorSchema.safeParse({ name: "Test" });
    expect(create.success).toBe(update.success);
  });

  it("rejects empty name", () => {
    expect(updateHumorFlavorSchema.safeParse({ name: "" }).success).toBe(false);
  });
});

describe("duplicateHumorFlavorSchema", () => {
  it("accepts a valid name", () => {
    const result = duplicateHumorFlavorSchema.safeParse({ name: "Copy of Dry Wit" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(duplicateHumorFlavorSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("rejects names longer than 500 chars", () => {
    expect(
      duplicateHumorFlavorSchema.safeParse({ name: "a".repeat(501) }).success
    ).toBe(false);
  });

  it("accepts names exactly 500 chars", () => {
    expect(
      duplicateHumorFlavorSchema.safeParse({ name: "a".repeat(500) }).success
    ).toBe(true);
  });
});

describe("createHumorFlavorStepSchema", () => {
  const validStep = {
    humor_flavor_id: 1,
    order_by: 0,
    llm_model_id: 2,
    llm_input_type_id: 3,
    llm_output_type_id: 4,
    humor_flavor_step_type_id: 5,
  };

  it("accepts a minimal valid step", () => {
    expect(createHumorFlavorStepSchema.safeParse(validStep).success).toBe(true);
  });

  it("accepts all optional fields", () => {
    const result = createHumorFlavorStepSchema.safeParse({
      ...validStep,
      description: "A step",
      llm_system_prompt: "You are helpful",
      llm_user_prompt: "Describe this",
      llm_temperature: 0.7,
    });
    expect(result.success).toBe(true);
  });

  it("rejects humor_flavor_id <= 0", () => {
    expect(
      createHumorFlavorStepSchema.safeParse({ ...validStep, humor_flavor_id: 0 }).success
    ).toBe(false);
  });

  it("rejects negative order_by", () => {
    expect(
      createHumorFlavorStepSchema.safeParse({ ...validStep, order_by: -1 }).success
    ).toBe(false);
  });

  it("rejects llm_temperature above 2", () => {
    expect(
      createHumorFlavorStepSchema.safeParse({ ...validStep, llm_temperature: 2.1 }).success
    ).toBe(false);
  });

  it("rejects llm_temperature below 0", () => {
    expect(
      createHumorFlavorStepSchema.safeParse({ ...validStep, llm_temperature: -0.1 }).success
    ).toBe(false);
  });

  it("accepts llm_temperature at boundary values 0 and 2", () => {
    expect(
      createHumorFlavorStepSchema.safeParse({ ...validStep, llm_temperature: 0 }).success
    ).toBe(true);
    expect(
      createHumorFlavorStepSchema.safeParse({ ...validStep, llm_temperature: 2 }).success
    ).toBe(true);
  });

  it("rejects missing required id fields", () => {
    const { llm_model_id: _, ...missing } = validStep;
    expect(createHumorFlavorStepSchema.safeParse(missing).success).toBe(false);
  });

  it("rejects non-integer order_by", () => {
    expect(
      createHumorFlavorStepSchema.safeParse({ ...validStep, order_by: 1.5 }).success
    ).toBe(false);
  });
});

describe("updateHumorFlavorStepSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    expect(updateHumorFlavorStepSchema.safeParse({}).success).toBe(true);
  });

  it("accepts partial update", () => {
    expect(
      updateHumorFlavorStepSchema.safeParse({ llm_temperature: 1.0 }).success
    ).toBe(true);
  });

  it("still validates field constraints when provided", () => {
    expect(
      updateHumorFlavorStepSchema.safeParse({ llm_temperature: 3.0 }).success
    ).toBe(false);
  });
});

describe("reorderStepSchema", () => {
  it("accepts valid from and to orders", () => {
    const result = reorderStepSchema.safeParse({ from_order: 0, to_order: 3 });
    expect(result.success).toBe(true);
  });

  it("accepts same from and to", () => {
    expect(reorderStepSchema.safeParse({ from_order: 2, to_order: 2 }).success).toBe(true);
  });

  it("rejects negative from_order", () => {
    expect(reorderStepSchema.safeParse({ from_order: -1, to_order: 1 }).success).toBe(false);
  });

  it("rejects negative to_order", () => {
    expect(reorderStepSchema.safeParse({ from_order: 1, to_order: -1 }).success).toBe(false);
  });

  it("rejects non-integer values", () => {
    expect(reorderStepSchema.safeParse({ from_order: 1.5, to_order: 2 }).success).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(reorderStepSchema.safeParse({ from_order: 1 }).success).toBe(false);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest"
import { getPatients } from "./api"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("API client", () => {
  it("requests the patient list with the bearer token", async () => {
    const payload = { data: [{ id: 1, nombre: "Paciente ficticio" }] }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => payload,
    })
    vi.stubGlobal("fetch", fetchMock)

    await expect(getPatients("demo-token")).resolves.toEqual(payload)
    expect(fetchMock).toHaveBeenCalledWith("/api/patients", {
      headers: { Authorization: "Bearer demo-token" },
    })
  })

  it("returns the API's error message to the caller", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "Se requiere autenticación." }),
    }))

    await expect(getPatients("invalid")).rejects.toMatchObject({
      message: "Se requiere autenticación.",
      status: 401,
    })
  })
})

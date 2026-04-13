const test = require("node:test");
const assert = require("node:assert/strict");
const { createEntityNaming } = require("../src/core/naming");

test("createEntityNaming builds deterministic names for a simple entity", () => {
  assert.deepEqual(createEntityNaming("Employee"), {
    entityName: "Employee",
    tableName: "employees",
    routeName: "employees",
    controllerName: "EmployeesController",
    pageComponentName: "EmployeesPage",
    formComponentName: "EmployeeForm",
  });
});

test("createEntityNaming uses plural kebab or snake variants for multi-word entities", () => {
  assert.deepEqual(createEntityNaming("ParkingRecord"), {
    entityName: "ParkingRecord",
    tableName: "parking_records",
    routeName: "parking-records",
    controllerName: "ParkingRecordsController",
    pageComponentName: "ParkingRecordsPage",
    formComponentName: "ParkingRecordForm",
  });
});

test("createEntityNaming uses a small predictable pluralization rule", () => {
  assert.equal(createEntityNaming("Company").tableName, "companies");
  assert.equal(createEntityNaming("Box").routeName, "boxes");
});

test("createEntityNaming rejects entity names outside PascalCase", () => {
  assert.throws(() => createEntityNaming("parkingRecord"), /PascalCase/);
});

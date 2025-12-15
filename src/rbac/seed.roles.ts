import { Role } from "./role.model";

export const seedRoles = async () => {
  const roles = [
    {
      name: "admin",
      permissions: ["create", "read", "update", "delete"],
    },
    {
      name: "manager",
      permissions: ["create", "read", "update"],
    },
    {
      name: "staff",
      permissions: ["read"],
    },
  ];

  for (const role of roles) {
    const exists = await Role.findOne({ name: role.name });
    if (!exists) {
      await Role.create(role);
      console.log(`✔ Role created: ${role.name}`);
    } else {
      console.log(`ℹ Role already exists: ${role.name}`);
    }
  }
};

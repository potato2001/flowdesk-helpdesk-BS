import type {
  AdminUserView,
  NewUser,
  Page,
  PageRequest,
  UserFilters,
  UserChangeSet,
  UserRepository,
  UserSummary,
} from "@/application/ports/out/repositories";
import type { Role } from "@/domain/user/role";
import type { User } from "@/domain/user/user";
import { getPrisma } from "./client";
import { ADMIN_USER_SELECT, toAdminUserView, toUser } from "./mappers";

export class PrismaUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const row = await getPrisma().user.findUnique({ where: { id } });
    return row ? toUser(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await getPrisma().user.findUnique({ where: { email } });
    return row ? toUser(row) : null;
  }

  async listAll(): Promise<AdminUserView[]> {
    const rows = await getPrisma().user.findMany({
      select: ADMIN_USER_SELECT,
      orderBy: [{ active: "desc" }, { name: "asc" }],
    });
    return rows.map(toAdminUserView);
  }

  async listPage(
    page: PageRequest,
    filters: UserFilters,
  ): Promise<Page<AdminUserView>> {
    const where = {
      ...(filters.role ? { role: filters.role } : {}),
      ...(filters.active === undefined ? {} : { active: filters.active }),
      ...(filters.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: "insensitive" as const } },
              { email: { contains: filters.search, mode: "insensitive" as const } },
              {
                department: {
                  contains: filters.search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };
    // Count and page are read together so `meta.total` matches the rows.
    const [total, rows] = await getPrisma().$transaction([
      getPrisma().user.count({ where }),
      getPrisma().user.findMany({
        where,
        select: ADMIN_USER_SELECT,
        orderBy: [{ active: "desc" }, { name: "asc" }],
        skip: (page.page - 1) * page.pageSize,
        take: page.pageSize,
      }),
    ]);
    return {
      items: rows.map(toAdminUserView),
      meta: {
        ...page,
        total,
        totalPages: Math.max(1, Math.ceil(total / page.pageSize)),
      },
    };
  }

  async listAssignable(): Promise<UserSummary[]> {
    const rows = await getPrisma().user.findMany({
      where: { active: true, role: { in: ["AGENT", "MANAGER", "ADMIN"] } },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    });
    return rows.map((row) => ({ ...row, role: row.role as Role }));
  }

  async countActiveAdmins(): Promise<number> {
    return getPrisma().user.count({ where: { role: "ADMIN", active: true } });
  }

  async create(user: NewUser): Promise<AdminUserView> {
    const row = await getPrisma().user.create({
      data: {
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        passwordHash: user.passwordHash,
        mustChangePassword: user.mustChangePassword,
      },
      select: ADMIN_USER_SELECT,
    });
    return toAdminUserView(row);
  }

  async update(id: string, change: UserChangeSet): Promise<AdminUserView> {
    const row = await getPrisma().user.update({
      where: { id },
      data: change,
      select: ADMIN_USER_SELECT,
    });
    return toAdminUserView(row);
  }

  async updateAndRevokeSessions(
    id: string,
    change: UserChangeSet,
  ): Promise<AdminUserView> {
    const row = await getPrisma().$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: change,
        select: ADMIN_USER_SELECT,
      });
      await tx.session.deleteMany({ where: { userId: id } });
      return updated;
    });
    return toAdminUserView(row);
  }
}

import { ChangePassword } from "@/application/use-cases/auth/change-password";
import { Authenticate } from "@/application/use-cases/auth/authenticate";
import { Login } from "@/application/use-cases/auth/login";
import { Logout } from "@/application/use-cases/auth/logout";
import { CreateUser } from "@/application/use-cases/admin/create-user";
import { ListAuditLogs } from "@/application/use-cases/admin/list-audit-logs";
import { ListSlaPolicies } from "@/application/use-cases/admin/list-sla-policies";
import { UpdateSlaPolicy } from "@/application/use-cases/admin/update-sla-policy";
import { ListUsers } from "@/application/use-cases/admin/list-users";
import { UpdateUser } from "@/application/use-cases/admin/update-user";
import { CheckHealth } from "@/application/use-cases/system/check-health";
import { AddAttachment } from "@/application/use-cases/tickets/add-attachment";
import { AddComment } from "@/application/use-cases/tickets/add-comment";
import { CreateTicket } from "@/application/use-cases/tickets/create-ticket";
import { DownloadAttachment } from "@/application/use-cases/tickets/download-attachment";
import { GetTicket } from "@/application/use-cases/tickets/get-ticket";
import { ListTickets } from "@/application/use-cases/tickets/list-tickets";
import { UpdateTicket } from "@/application/use-cases/tickets/update-ticket";
import { ListAssignableUsers } from "@/application/use-cases/users/list-assignable-users";
import type {
  AuthenticateUseCase,
  ChangePasswordUseCase,
  LoginUseCase,
  LogoutUseCase,
} from "@/application/ports/in/auth";
import type {
  CheckHealthUseCase,
  CreateUserUseCase,
  ListAssignableUsersUseCase,
  ListAuditLogsUseCase,
  ListSlaPoliciesUseCase,
  ListUsersUseCase,
  UpdateSlaPolicyUseCase,
  UpdateUserUseCase,
} from "@/application/ports/in/admin";
import type {
  AddAttachmentUseCase,
  AddCommentUseCase,
  CreateTicketUseCase,
  DownloadAttachmentUseCase,
  GetTicketUseCase,
  ListTicketsUseCase,
  UpdateTicketUseCase,
} from "@/application/ports/in/tickets";
import { NextSessionCookieStore } from "./http/next-session-cookie-store";
import { PrismaAttachmentRepository } from "./prisma/attachment-repository";
import { PrismaAuditRepository } from "./prisma/audit-repository";
import { PrismaCommentRepository } from "./prisma/comment-repository";
import { PrismaHealthRepository } from "./prisma/health-repository";
import { PrismaSessionRepository } from "./prisma/session-repository";
import { PrismaSlaPolicyRepository } from "./prisma/sla-policy-repository";
import { PrismaTicketRepository } from "./prisma/ticket-repository";
import { PrismaUserRepository } from "./prisma/user-repository";
import { BcryptPasswordHasher } from "./security/bcrypt-password-hasher";
import { CryptoTokenGenerator } from "./security/crypto-token-generator";
import { LocalFileStorage } from "./storage/local-file-storage";
import { SystemClock } from "./system-clock";

/**
 * Composition root: the single place where concrete adapters are chosen and
 * wired into use cases. Everything above depends on interfaces only, so
 * swapping an implementation is an edit to this file alone.
 *
 * The cookie store reads request-scoped state, so the graph is rebuilt per
 * call rather than cached across requests.
 */
/**
 * Callers see input ports, never the concrete use-case classes, so a route can
 * never reach past the contract into an implementation detail.
 */
export type Container = {
  auth: AuthenticateUseCase;
  login: LoginUseCase;
  logout: LogoutUseCase;
  changePassword: ChangePasswordUseCase;
  listTickets: ListTicketsUseCase;
  createTicket: CreateTicketUseCase;
  getTicket: GetTicketUseCase;
  updateTicket: UpdateTicketUseCase;
  addComment: AddCommentUseCase;
  addAttachment: AddAttachmentUseCase;
  downloadAttachment: DownloadAttachmentUseCase;
  listUsers: ListUsersUseCase;
  createUser: CreateUserUseCase;
  updateUser: UpdateUserUseCase;
  listAuditLogs: ListAuditLogsUseCase;
  listSlaPolicies: ListSlaPoliciesUseCase;
  updateSlaPolicy: UpdateSlaPolicyUseCase;
  listAssignableUsers: ListAssignableUsersUseCase;
  checkHealth: CheckHealthUseCase;
};

export function buildContainer(): Container {
  const clock = new SystemClock();
  const tokens = new CryptoTokenGenerator();
  const hasher = new BcryptPasswordHasher();
  const storage = new LocalFileStorage();
  const cookies = new NextSessionCookieStore();

  const users = new PrismaUserRepository();
  const sessions = new PrismaSessionRepository();
  const tickets = new PrismaTicketRepository();
  const comments = new PrismaCommentRepository();
  const attachments = new PrismaAttachmentRepository();
  const audit = new PrismaAuditRepository();
  const slaPolicies = new PrismaSlaPolicyRepository();
  const health = new PrismaHealthRepository();

  const auth = new Authenticate(sessions, cookies, tokens, clock);

  return {
    auth,
    login: new Login(users, audit, hasher, auth, clock),
    logout: new Logout(auth),
    changePassword: new ChangePassword(users, audit, hasher, auth, clock),

    listTickets: new ListTickets(tickets, clock),
    createTicket: new CreateTicket(
      tickets,
      slaPolicies,
      users,
      audit,
      hasher,
      tokens,
      clock,
    ),
    getTicket: new GetTicket(tickets, clock),
    updateTicket: new UpdateTicket(tickets, clock),
    addComment: new AddComment(tickets, comments),
    addAttachment: new AddAttachment(tickets, attachments, storage, tokens),
    downloadAttachment: new DownloadAttachment(attachments, storage),

    listUsers: new ListUsers(users),
    createUser: new CreateUser(users, audit, hasher),
    updateUser: new UpdateUser(users, audit, hasher, clock),
    listAuditLogs: new ListAuditLogs(audit),
    listSlaPolicies: new ListSlaPolicies(slaPolicies),
    updateSlaPolicy: new UpdateSlaPolicy(slaPolicies, audit),
    listAssignableUsers: new ListAssignableUsers(users),

    checkHealth: new CheckHealth(health),
  };
}

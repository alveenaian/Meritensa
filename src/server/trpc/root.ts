import {
  createCallerFactory,
  createTRPCRouter,
} from "~/server/trpc/main";
import * as authProcedures from "~/server/trpc/procedures/auth.procedures";
import * as caseProcedures from "~/server/trpc/procedures/case.procedures";
import * as caseChatProcedures from "~/server/trpc/procedures/case-chat.procedures";
import * as caseAnalysisProcedures from "~/server/trpc/procedures/case-analysis.procedures";
import * as caseProProcedures from "~/server/trpc/procedures/case-pro.procedures";
import * as documentProcedures from "~/server/trpc/procedures/document.procedures";
import * as documentUploadProxyProcedures from "~/server/trpc/procedures/document-upload-proxy.procedures";
import * as adminProcedures from "~/server/trpc/procedures/admin.procedures";
import * as userProcedures from "~/server/trpc/procedures/user.procedures";
import * as paymentProcedures from "~/server/trpc/procedures/payment.procedures";
import * as waitlistProcedures from "~/server/trpc/procedures/waitlist.procedures";
import * as cmsProcedures from "~/server/trpc/procedures/cms.procedures";
import * as healthProcedures from "~/server/trpc/procedures/health.procedures";

export const appRouter = createTRPCRouter({
  // Health check (no auth required)
  health: healthProcedures.healthCheck,
  
  // Auth procedures
  register: authProcedures.register,
  login: authProcedures.login,
  logout: authProcedures.logout,
  getCurrentUser: authProcedures.getCurrentUser,
  forgotPassword: authProcedures.forgotPassword,
  resetPassword: authProcedures.resetPassword,
  verifyEmail: authProcedures.verifyEmail,
  updateProfile: authProcedures.updateProfile,
  changePassword: authProcedures.changePassword,
  deleteAccount: authProcedures.deleteAccount,
  
  // Waitlist procedures
  joinWaitlistStepOne: waitlistProcedures.joinWaitlistStepOne,
  updateWaitlistStepTwo: waitlistProcedures.updateWaitlistStepTwo,
  
  // Case CRUD procedures
  createCase: caseProcedures.createCase,
  listCases: caseProcedures.listCases,
  getCaseDetails: caseProcedures.getCaseDetails,
  deleteCase: caseProcedures.deleteCase,
  updateCaseTitle: caseProcedures.updateCaseTitle,
  updateCaseField: caseProcedures.updateCaseField,
  updateCaseStage: caseProcedures.updateCaseStage,
  saveUserIntent: caseProcedures.saveUserIntent,
  confirmNarrative: caseProcedures.confirmNarrative,
  submitIntakeForm: caseProcedures.submitIntakeForm,
  saveIntakeProgress: caseProcedures.saveIntakeProgress,
  requestReferral: caseProcedures.requestReferral,
  requestFunding: caseProcedures.requestFunding,
  downloadCasePacket: caseProcedures.downloadCasePacket,
  
  // Case chat procedures
  sendMessage: caseChatProcedures.sendMessage,
  sendInitialGreeting: caseChatProcedures.sendInitialGreeting,
  acknowledgeDocument: caseChatProcedures.acknowledgeDocument,
  
  // Case analysis procedures
  runCaseAnalysis: caseAnalysisProcedures.runCaseAnalysis,
  getAnalysisStatus: caseAnalysisProcedures.getAnalysisStatus,
  calculateCaseScore: caseAnalysisProcedures.calculateCaseScore,
  
  // Case pro procedures
  generateProAnalysis: caseProProcedures.generateProAnalysis,
  
  // Document procedures
  getPresignedUploadUrl: documentProcedures.getPresignedUploadUrl,
  listDocuments: documentProcedures.listDocuments,
  getDocumentDownloadUrl: documentProcedures.getDocumentDownloadUrl,
  deleteDocument: documentProcedures.deleteDocument,
  analyzeDocument: documentProcedures.analyzeDocument,
  getMinioBaseUrl: documentProcedures.getMinioBaseUrl,
  listAllUserDocuments: documentProcedures.listAllUserDocuments,
  updateDocumentCategory: documentProcedures.updateDocumentCategory,
  
  // Document upload proxy (fallback for environments where Minio is not publicly accessible)
  checkMinioPublicAccess: documentUploadProxyProcedures.checkMinioPublicAccess,
  uploadDocumentProxy: documentUploadProxyProcedures.uploadDocumentProxy,
  
  // Payment procedures
  createCheckoutSession: paymentProcedures.createCheckoutSession,
  verifyPayment: paymentProcedures.verifyPayment,
  
  // Admin procedures
  getAnalyticsSummary: adminProcedures.getAnalyticsSummary,
  getRecentActivity: adminProcedures.getRecentActivity,
  getAllCases: adminProcedures.getAllCases,
  updateCaseStatus: adminProcedures.updateCaseStatus,
  getAdminCaseDetails: adminProcedures.getAdminCaseDetails,
  addAdminComment: adminProcedures.addAdminComment,
  impersonateUser: adminProcedures.impersonateUser,
  exportAllCasesCsv: adminProcedures.exportAllCasesCsv,
  getSystemHealth: adminProcedures.getSystemHealth,
  
  // Feature management (admin only)
  getFeatureConfigs: adminProcedures.getFeatureConfigs,
  updateFeatureConfig: adminProcedures.updateFeatureConfig,
  
  // CMS procedures
  listPages: cmsProcedures.listPages,
  listBlogPosts: cmsProcedures.listBlogPosts,
  getPage: cmsProcedures.getPage,
  getPageBySlug: cmsProcedures.getPageBySlug,
  createPage: cmsProcedures.createPage,
  updatePage: cmsProcedures.updatePage,
  deletePage: cmsProcedures.deletePage,
  togglePagePublish: cmsProcedures.togglePagePublish,
  sendPageAsEmail: cmsProcedures.sendPageAsEmail,
  listNavigationItems: cmsProcedures.listNavigationItems,
  createNavigationItem: cmsProcedures.createNavigationItem,
  updateNavigationItem: cmsProcedures.updateNavigationItem,
  deleteNavigationItem: cmsProcedures.deleteNavigationItem,
  reorderNavigationItems: cmsProcedures.reorderNavigationItems,
  getSiteSettings: cmsProcedures.getSiteSettings,
  updateSiteSettings: cmsProcedures.updateSiteSettings,
  
  // User management procedures (admin only)
  getAllUsers: userProcedures.getAllUsers,
  getUserDetails: userProcedures.getUserDetails,
  updateUserRole: userProcedures.updateUserRole,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);

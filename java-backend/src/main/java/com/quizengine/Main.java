package com.quizengine;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quizengine.dao.XmlQuestionDao;
import com.quizengine.security.AdminAuthFilter;
import com.quizengine.security.CorsFilter;
import com.quizengine.security.JwtAuthFilter;
import com.quizengine.service.AdminQuestionService;
import com.quizengine.service.QuizEvaluationService;
import com.quizengine.service.ScoringService;
import com.quizengine.service.XmlQuestionService;
import com.quizengine.servlet.*;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.catalina.Context;
import org.apache.catalina.startup.Tomcat;
import org.apache.tomcat.util.descriptor.web.FilterDef;
import org.apache.tomcat.util.descriptor.web.FilterMap;

import java.io.File;
import java.io.IOException;
import java.util.Map;

/**
 * Main application entry point for the QuizEngine Java Servlet Backend & JSP Admin Portal.
 * Boots an Embedded Apache Tomcat 10.1 server with Jasper JSP engine on port 8088.
 */
public class Main {

    public static final int DEFAULT_PORT = 8088;

    public static void main(String[] args) throws Exception {
        int port = getPort();
        System.out.println("==================================================");
        System.out.println("🚀 Starting QuizEngine Embedded Apache Tomcat 10.1");
        System.out.println("⚡ Target Port: " + port);
        System.out.println("==================================================");

        // Security check: Fail securely if JWT_SECRET is missing from the environment
        String jwtSecret = JwtAuthFilter.resolveJwtSecret();

        Tomcat tomcat = new Tomcat();
        tomcat.setPort(port);
        File baseDir = new File("temp-tomcat");
        if (!baseDir.exists()) baseDir.mkdirs();
        tomcat.setBaseDir(baseDir.getAbsolutePath());
        tomcat.getConnector(); // Initialize default HTTP connector

        // Base webapp directory containing WEB-INF/web.xml and JSP views
        File docBase = resolveWebappDir();
        System.out.println("📁 WebApp DocBase resolved: " + docBase.getAbsolutePath());

        // addWebapp configures standard servlet lifecycle, Jasper JSP compiler, and session manager
        Context ctx = tomcat.addWebapp("", docBase.getAbsolutePath());
        ctx.setParentClassLoader(Main.class.getClassLoader());
        ctx.setSessionTimeout(60);
        ctx.setSessionCookieName("QE_ADMIN_SESSION");
        ctx.setUseHttpOnly(true);
        org.apache.tomcat.util.http.Rfc6265CookieProcessor cookieProcessor = new org.apache.tomcat.util.http.Rfc6265CookieProcessor();
        cookieProcessor.setSameSiteCookies("lax");
        ctx.setCookieProcessor(cookieProcessor);

        // Initialize shared singletons and services
        XmlQuestionDao questionDao = new XmlQuestionDao();
        XmlQuestionService questionService = new XmlQuestionService(questionDao);
        ScoringService scoringService = new ScoringService();
        QuizEvaluationService evaluationService = new QuizEvaluationService(questionDao, scoringService);
        AdminQuestionService adminQuestionService = new AdminQuestionService(questionDao);
        ObjectMapper objectMapper = new ObjectMapper();

        System.out.println("📦 XML Question Store Initialized: " + questionDao.getQuestionCount() + " questions, "
                + questionDao.getTopicCount() + " topics loaded from " + questionDao.getQuestionsXmlPath());

        // ─── 1. Register Filters ────────────────────────────────────────────────
        // CORS Filter for cross-origin client integration
        FilterDef corsDef = new FilterDef();
        corsDef.setFilterName("CorsFilter");
        corsDef.setFilter(new CorsFilter());
        ctx.addFilterDef(corsDef);

        FilterMap corsMap = new FilterMap();
        corsMap.setFilterName("CorsFilter");
        corsMap.addURLPattern("/*");
        ctx.addFilterMap(corsMap);

        // JWT Authentication Filter protecting student quiz evaluation API
        FilterDef jwtDef = new FilterDef();
        jwtDef.setFilterName("JwtAuthFilter");
        jwtDef.setFilter(new JwtAuthFilter(jwtSecret));
        ctx.addFilterDef(jwtDef);

        FilterMap jwtMap = new FilterMap();
        jwtMap.setFilterName("JwtAuthFilter");
        jwtMap.addURLPattern("/api/java/quiz/*");
        ctx.addFilterMap(jwtMap);

        // Admin Authentication & CSRF Filter protecting /admin/*
        FilterDef adminAuthDef = new FilterDef();
        adminAuthDef.setFilterName("AdminAuthFilter");
        adminAuthDef.setFilter(new AdminAuthFilter());
        ctx.addFilterDef(adminAuthDef);

        FilterMap adminAuthMap = new FilterMap();
        adminAuthMap.setFilterName("AdminAuthFilter");
        adminAuthMap.addURLPattern("/admin/*");
        ctx.addFilterMap(adminAuthMap);

        // ─── 2. Register Student & Public API Servlets ──────────────────────────
        Tomcat.addServlet(ctx, "QuizQuestionServlet", new QuizQuestionServlet(questionService, objectMapper));
        ctx.addServletMappingDecoded("/api/java/questions", "QuizQuestionServlet");

        Tomcat.addServlet(ctx, "QuizEvaluationServlet", new QuizEvaluationServlet(evaluationService, objectMapper));
        ctx.addServletMappingDecoded("/api/java/quiz/evaluate", "QuizEvaluationServlet");

        Tomcat.addServlet(ctx, "TopicServlet", new TopicServlet(questionService, objectMapper));
        ctx.addServletMappingDecoded("/api/java/topics", "TopicServlet");

        Tomcat.addServlet(ctx, "HealthServlet", new HttpServlet() {
            @Override
            protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
                resp.setContentType("application/json");
                objectMapper.writeValue(resp.getWriter(), Map.of(
                        "status", "ok",
                        "service", "QuizEngine Java Servlet Backend & JSP Admin",
                        "port", port,
                        "questionCount", questionDao.getQuestionCount(),
                        "topicCount", questionDao.getTopicCount(),
                        "datastoreHealthy", questionDao.isDatastoreHealthy(),
                        "lastLoadedTime", String.valueOf(questionDao.getLastLoadedTime())
                ));
            }
        });
        ctx.addServletMappingDecoded("/api/java/health", "HealthServlet");

        // ─── 3. Register JSP Admin Servlets ─────────────────────────────────────
        Tomcat.addServlet(ctx, "AdminLoginServlet", new AdminLoginServlet());
        ctx.addServletMappingDecoded("/admin/login", "AdminLoginServlet");

        Tomcat.addServlet(ctx, "AdminLogoutServlet", new AdminLogoutServlet());
        ctx.addServletMappingDecoded("/admin/logout", "AdminLogoutServlet");

        Tomcat.addServlet(ctx, "AdminDashboardServlet", new AdminDashboardServlet(adminQuestionService));
        ctx.addServletMappingDecoded("/admin/dashboard", "AdminDashboardServlet");

        Tomcat.addServlet(ctx, "QuestionManagementServlet", new QuestionManagementServlet(adminQuestionService));
        ctx.addServletMappingDecoded("/admin/questions", "QuestionManagementServlet");
        ctx.addServletMappingDecoded("/admin/questions/*", "QuestionManagementServlet");

        Tomcat.addServlet(ctx, "TopicManagementServlet", new TopicManagementServlet(adminQuestionService));
        ctx.addServletMappingDecoded("/admin/topics", "TopicManagementServlet");

        // Root redirect to Admin portal
        Tomcat.addServlet(ctx, "RootServlet", new HttpServlet() {
            @Override
            protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
                resp.sendRedirect(req.getContextPath() + "/admin/dashboard");
            }
        });
        ctx.addServletMappingDecoded("/", "RootServlet");

        tomcat.start();
        System.out.println("✅ Embedded Tomcat running at: http://localhost:" + port + "/admin/dashboard");

        // Keep running until terminated
        tomcat.getServer().await();
    }

    private static File resolveWebappDir() {
        String envWebapp = System.getenv("WEBAPP_DIR");
        if (envWebapp != null && !envWebapp.trim().isEmpty()) {
            File dir = new File(envWebapp.trim());
            if (dir.exists()) return dir.getAbsoluteFile();
        }

        File webapp = new File("src/main/webapp");
        if (webapp.exists()) return webapp.getAbsoluteFile();

        File nestedWebapp = new File("java-backend/src/main/webapp");
        if (nestedWebapp.exists()) return nestedWebapp.getAbsoluteFile();

        return new File("D:/QUIZENGINE/quizengine/java-backend/src/main/webapp").getAbsoluteFile();
    }

    public static int getPort() {
        String envPort = System.getenv("JAVA_PORT");
        if (envPort == null || envPort.trim().isEmpty()) {
            envPort = System.getenv("PORT");
        }
        if (envPort != null) {
            try {
                int p = Integer.parseInt(envPort.trim());
                if (p > 0 && p < 65536 && p != 5000 && p != 5001 && p != 3000) {
                    return p;
                }
            } catch (NumberFormatException ignored) {}
        }
        return DEFAULT_PORT;
    }
}

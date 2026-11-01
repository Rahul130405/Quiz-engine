package com.quizengine.servlet;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class JspRenderingTest {

    @Test
    @DisplayName("1. JSP configuration and templates validation")
    void testJspTemplatesConfiguration() throws IOException {
        File webappDir = new File("src/main/webapp");
        if (!webappDir.exists()) {
            webappDir = new File("java-backend/src/main/webapp");
        }
        assertTrue(webappDir.exists(), "Webapp directory must exist");

        // Verify web.xml
        File webXml = new File(webappDir, "WEB-INF/web.xml");
        assertTrue(webXml.exists(), "web.xml must exist in WEB-INF");
        String webXmlContent = Files.readString(webXml.toPath());
        assertTrue(webXmlContent.contains("jakarta.ee/xml/ns/jakartaee"), "web.xml must declare Jakarta EE 6.0 schema");

        // List of all required JSP pages
        List<String> jspFiles = List.of(
                "WEB-INF/jsp/admin/login.jsp",
                "WEB-INF/jsp/admin/dashboard.jsp",
                "WEB-INF/jsp/admin/questions.jsp",
                "WEB-INF/jsp/admin/create-question.jsp",
                "WEB-INF/jsp/admin/edit-question.jsp",
                "WEB-INF/jsp/admin/topics.jsp",
                "WEB-INF/jsp/admin/error.jsp",
                "WEB-INF/jsp/admin/header.jspf",
                "WEB-INF/jsp/admin/footer.jspf"
        );

        for (String relativePath : jspFiles) {
            File jspFile = new File(webappDir, relativePath);
            assertTrue(jspFile.exists(), "JSP template must exist: " + relativePath);
            String content = Files.readString(jspFile.toPath());

            // Verify JSP taglib or page directives
            assertTrue(content.contains("page contentType=\"text/html;charset=UTF-8\""),
                    "JSP must contain valid UTF-8 page directive: " + relativePath);
        }
    }
}

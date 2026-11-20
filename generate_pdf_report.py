import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    KeepTogether,
    PageBreak,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

# Numbered Canvas for professional "Page X of Y" and header/footer
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        print(f"Total pages in document: {num_pages}")
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 11 * inch - 36, "Mentora • Backend Developer Assignment REST API Documentation")
            self.drawRightString(8.5 * inch - 54, 11 * inch - 36, "Node.js • TypeScript • Express • MongoDB")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(54, 11 * inch - 42, 8.5 * inch - 54, 11 * inch - 42)

        # Footer (all pages)
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(54, 45, 8.5 * inch - 54, 45)

        self.drawString(54, 32, "Confidential & Proprietary • Saurabh Agnihotri (Saurabh-183) • 2026")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(8.5 * inch - 54, 32, page_str)
        self.restoreState()

def create_documentation_pdf(filename="Backend_Developer_Assignment_Documentation.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=44,
        rightMargin=44,
        topMargin=38,
        bottomMargin=44,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor("#1e293b")
    brand_blue = colors.HexColor("#2563eb")
    accent_green = colors.HexColor("#059669")
    dark_gray = colors.HexColor("#334155")
    code_bg = colors.HexColor("#f8fafc")

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=primary_color,
        spaceAfter=2,
    )

    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=14,
        textColor=brand_blue,
        spaceAfter=8,
    )

    h1_style = ParagraphStyle(
        "Heading1_Custom",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=12.5,
        leading=16,
        textColor=primary_color,
        spaceBefore=7,
        spaceAfter=4,
        keepWithNext=True,
    )

    h2_style = ParagraphStyle(
        "Heading2_Custom",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=5,
        spaceAfter=3,
        keepWithNext=True,
    )

    body_style = ParagraphStyle(
        "Body_Custom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=dark_gray,
        spaceAfter=4,
    )

    body_bold = ParagraphStyle(
        "Body_Bold",
        parent=body_style,
        fontName="Helvetica-Bold",
    )

    code_style = ParagraphStyle(
        "Code_Block",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor("#0f172a"),
    )

    table_header_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.white,
    )

    table_cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=dark_gray,
    )

    table_cell_code = ParagraphStyle(
        "TableCellCode",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#1e293b"),
    )

    story = []

    # =========================================================================
    # PAGE 1: TITLE, EXECUTIVE SUMMARY & PROJECT DELIVERABLES
    # =========================================================================
    story.append(Paragraph("Mentora • Teacher Session Booking Platform", title_style))
    story.append(Paragraph("REST API Implementation, Architecture & Verification Report • Backend Assignment", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=brand_blue, spaceBefore=0, spaceAfter=10))

    story.append(Paragraph("1. Executive Summary & Objective", h1_style))
    story.append(Paragraph(
        "This technical document presents the complete production-grade implementation of the <b>Backend Developer Assignment</b>. "
        "The project implements a resilient REST API platform where teachers publish availability slots, students discover and book sessions, "
        "and completed sessions are tracked in historical profiles. Built strictly with <b>Node.js, TypeScript, Express.js, MongoDB, and Mongoose</b>, "
        "the architecture features 100% async/await programming, strict Zod schema validation, centralized error handling, and high-performance "
        "<b>MongoDB Aggregation Pipelines</b> (including multi-stage <code>$facet</code>, <code>$lookup</code>, <code>$unwind</code>, and <code>$match</code>).",
        body_style
    ))

    story.append(Paragraph("2. Official Project Deliverables & Live Links", h1_style))
    links_data = [
        [Paragraph("Deliverable Artifact", table_header_style), Paragraph("Live URL / Production Access Link", table_header_style), Paragraph("Verification Scope", table_header_style)],
        [
            Paragraph("<b>Live Cloud Frontend (Vercel)</b>", table_cell_style),
            Paragraph("<u>https://school-management-system-frontend-flame.vercel.app</u>", table_cell_code),
            Paragraph("Responsive Next.js UI, role dashboards, session booking, and student directory.", table_cell_style)
        ],
        [
            Paragraph("<b>Live Cloud Backend (Render)</b>", table_cell_style),
            Paragraph("<u>https://school-management-system-backend-3rco.onrender.com</u>", table_cell_code),
            Paragraph("Production REST API with Express, TypeScript, and MongoDB Atlas.", table_cell_style)
        ],
        [
            Paragraph("<b>Interactive Swagger Docs</b>", table_cell_style),
            Paragraph("<u>https://school-management-system-backend-3rco.onrender.com/api-docs</u>", table_cell_code),
            Paragraph("Interactive OpenAPI specifications for all 6 core APIs and testing schema.", table_cell_style)
        ],
        [
            Paragraph("<b>GitHub Backend Repository</b>", table_cell_style),
            Paragraph("<u>https://github.com/Saurabh-183/school-management-system-backend</u>", table_cell_code),
            Paragraph("Source code, controllers, services, pipelines, seeds, and unit tests.", table_cell_style)
        ],
        [
            Paragraph("<b>GitHub Frontend Repository</b>", table_cell_style),
            Paragraph("<u>https://github.com/Saurabh-183/school-management-system-frontend</u>", table_cell_code),
            Paragraph("MUI v6 dashboard, role portals, video upload, and in-app document viewer.", table_cell_style)
        ],
        [
            Paragraph("<b>Postman Test Collection</b>", table_cell_style),
            Paragraph("<code>backend/postman_collection.json</code>", table_cell_code),
            Paragraph("Automated test suite covering all 6 endpoints with environment variables.", table_cell_style)
        ],
    ]
    t_links = Table(links_data, colWidths=[1.7 * inch, 3.4 * inch, 2.1 * inch])
    t_links.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
    ]))
    story.append(t_links)
    story.append(Spacer(1, 6))

    story.append(Paragraph("3. Pre-Seeded Testing Credentials (Assignment Specific Roles)", h1_style))
    story.append(Paragraph(
        "To test the software strictly within the required assignment scope (Teachers & Students), "
        "the database is pre-seeded with active credentials below. <i>(Administrative and super-admin credentials are intentionally omitted per submission security guidelines.)</i>",
        body_style
    ))

    creds_data = [
        [Paragraph("Role", table_header_style), Paragraph("Full Name", table_header_style), Paragraph("Login Email", table_header_style), Paragraph("Password", table_header_style), Paragraph("Role Permissions", table_header_style)],
        [
            Paragraph("<b>TEACHER</b>", table_cell_style),
            Paragraph("Manas Tiwari", table_cell_style),
            Paragraph("<code>manas.tiwari@example.com</code>", table_cell_code),
            Paragraph("<code>Password@123</code>", table_cell_code),
            Paragraph("Publish available slots (API 2), view mentor schedule, mark complete (API 5).", table_cell_style),
        ],
        [
            Paragraph("<b>TEACHER</b>", table_cell_style),
            Paragraph("Abhishek Singh", table_cell_style),
            Paragraph("<code>abhishek.singh@example.com</code>", table_cell_code),
            Paragraph("<code>Password@123</code>", table_cell_code),
            Paragraph("Publish available slots (API 2), upload lectures/notes, mark complete (API 5).", table_cell_style),
        ],
        [
            Paragraph("<b>STUDENT</b>", table_cell_style),
            Paragraph("Saurabh Agnihotri", table_cell_style),
            Paragraph("<code>saurabh.agnihotri@example.com</code>", table_cell_code),
            Paragraph("<code>Password@123</code>", table_cell_code),
            Paragraph("Discover slots by date (API 3), book session (API 4), view history (API 6).", table_cell_style),
        ],
        [
            Paragraph("<b>STUDENT</b>", table_cell_style),
            Paragraph("Anjali Verma", table_cell_style),
            Paragraph("<code>anjali.verma@example.com</code>", table_cell_code),
            Paragraph("<code>Password@123</code>", table_cell_code),
            Paragraph("Discover slots by date (API 3), book session (API 4), view history (API 6).", table_cell_style),
        ],
    ]
    t_creds = Table(creds_data, colWidths=[1.1 * inch, 1.4 * inch, 2.1 * inch, 1.1 * inch, 1.5 * inch])
    t_creds.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), brand_blue),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
    ]))
    story.append(t_creds)

    # Page Break -> PAGE 2
    story.append(PageBreak())

    # =========================================================================
    # PAGE 2: SYSTEM ARCHITECTURE & DATABASE SCHEMAS
    # =========================================================================
    story.append(Paragraph("4. System Architecture & Design Patterns", h1_style))
    story.append(Paragraph(
        "The backend is structured according to the <b>Clean N-Tier Layered Architecture</b>. "
        "This decouples HTTP transport logic from domain business rules and database queries, guaranteeing high maintainability, "
        "strict testability, and enterprise reliability.",
        body_style
    ))

    # Architecture Flow Box
    arch_box_data = [
        [
            Paragraph(
                "<b>[Client Tier]</b> Next.js 16 (App Router) / Postman Test Suite / Swagger UI<br/>"
                "&nbsp;&nbsp;&nbsp;&nbsp;↓ <i>HTTPS Requests with JSON Payload & JWT Bearer Token</i><br/>"
                "<b>[Routing & Middleware Tier]</b> Express Router → CORS → Morgan Logger → Zod Validation Middleware<br/>"
                "&nbsp;&nbsp;&nbsp;&nbsp;↓ <i>Validated Typed Request Objects (req.body, req.query, req.params)</i><br/>"
                "<b>[Controller Tier]</b> <code>UserController</code>, <code>SessionController</code>, <code>TeacherController</code> (Async Handler Wrapper)<br/>"
                "&nbsp;&nbsp;&nbsp;&nbsp;↓ <i>Business Delegation (Throws AppError on Business Rule Violations)</i><br/>"
                "<b>[Service Tier]</b> <code>UserService</code>, <code>SessionService</code>, <code>TeacherService</code> (MongoDB Aggregation Pipelines)<br/>"
                "&nbsp;&nbsp;&nbsp;&nbsp;↓ <i>Mongoose ORM Schema Operations</i><br/>"
                "<b>[Database Tier]</b> MongoDB 8.0 Engine (ReplicaSet, Compound Indexes, Atomic Transactions)",
                code_style
            )
        ]
    ]
    t_arch = Table(arch_box_data, colWidths=[7.2 * inch])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), code_bg),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#94a3b8")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_arch)
    story.append(Spacer(1, 5))

    story.append(Paragraph("5. Detailed Database Schemas (Mongoose / MongoDB)", h1_style))
    story.append(Paragraph(
        "All database schemas rigorously adhere to the assignment specification while adding robust field types, validations, and indexes:",
        body_style
    ))

    # Schema 1: User
    story.append(Paragraph("<b>A. User Collection Schema (<code>IUser</code>)</b>", h2_style))
    user_schema_data = [
        [Paragraph("Field Name", table_header_style), Paragraph("Type", table_header_style), Paragraph("Index / Constraints", table_header_style), Paragraph("Description & Specification", table_header_style)],
        [Paragraph("<code>fullName</code>", table_cell_code), Paragraph("String", table_cell_style), Paragraph("Required, Trim", table_cell_style), Paragraph("Student or user full name.", table_cell_style)],
        [Paragraph("<code>email</code>", table_cell_code), Paragraph("String", table_cell_style), Paragraph("<b>Unique</b>, Lowercase, Indexed", table_cell_style), Paragraph("Unique user email identity. Enforced via DB unique index.", table_cell_style)],
        [Paragraph("<code>phone</code>", table_cell_code), Paragraph("String", table_cell_style), Paragraph("Required, Trim", table_cell_style), Paragraph("Primary phone number for notifications.", table_cell_style)],
        [Paragraph("<code>password</code>", table_cell_code), Paragraph("String", table_cell_style), Paragraph("Select: false (Protected)", table_cell_style), Paragraph("Bcrypt hashed password (10 salt rounds).", table_cell_style)],
        [Paragraph("<code>role</code>", table_cell_code), Paragraph("String", table_cell_style), Paragraph("Enum: STUDENT / TEACHER / ADMIN", table_cell_style), Paragraph("RBAC permission tier.", table_cell_style)],
        [Paragraph("<code>timestamps</code>", table_cell_code), Paragraph("Date", table_cell_style), Paragraph("Automatic (createdAt, updatedAt)", table_cell_style), Paragraph("Mongoose managed audit timestamps.", table_cell_style)],
    ]
    t_user_s = Table(user_schema_data, colWidths=[1.3 * inch, 0.9 * inch, 2.0 * inch, 3.0 * inch])
    t_user_s.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
    ]))
    story.append(t_user_s)
    story.append(Spacer(1, 4))

    # Schema 2: Teacher
    story.append(Paragraph("<b>B. Teacher Collection Schema (<code>ITeacher</code>)</b>", h2_style))
    teacher_schema_data = [
        [Paragraph("Field Name", table_header_style), Paragraph("Type", table_header_style), Paragraph("Index / Constraints", table_header_style), Paragraph("Description & Specification", table_header_style)],
        [Paragraph("<code>fullName</code>", table_cell_code), Paragraph("String", table_cell_style), Paragraph("Required, Trim", table_cell_style), Paragraph("Full name of the faculty mentor.", table_cell_style)],
        [Paragraph("<code>email</code>", table_cell_code), Paragraph("String", table_cell_style), Paragraph("Required, Lowercase, Indexed", table_cell_style), Paragraph("Teacher academic email address.", table_cell_style)],
        [Paragraph("<code>specialization</code>", table_cell_code), Paragraph("String", table_cell_style), Paragraph("Required, Trim", table_cell_style), Paragraph("Domain subject (e.g., Data Structures, Node.js).", table_cell_style)],
        [Paragraph("<code>experience</code>", table_cell_code), Paragraph("Number", table_cell_style), Paragraph("Required, Min: 0", table_cell_style), Paragraph("Years of professional mentoring experience.", table_cell_style)],
        [Paragraph("<code>timestamps</code>", table_cell_code), Paragraph("Date", table_cell_style), Paragraph("Automatic", table_cell_style), Paragraph("Creation and modification timestamps.", table_cell_style)],
    ]
    t_teach_s = Table(teacher_schema_data, colWidths=[1.3 * inch, 0.9 * inch, 2.0 * inch, 3.0 * inch])
    t_teach_s.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
    ]))
    story.append(t_teach_s)
    story.append(Spacer(1, 4))

    # Schema 3: Session
    story.append(Paragraph("<b>C. Session Collection Schema (<code>ISession</code>)</b>", h2_style))
    session_schema_data = [
        [Paragraph("Field Name", table_header_style), Paragraph("Type", table_header_style), Paragraph("Index / Constraints", table_header_style), Paragraph("Description & Specification", table_header_style)],
        [Paragraph("<code>teacherId</code>", table_cell_code), Paragraph("ObjectId", table_cell_style), Paragraph("Ref: 'Teacher', Indexed", table_cell_style), Paragraph("Mandatory reference to the teacher hosting the slot.", table_cell_style)],
        [Paragraph("<code>userId</code>", table_cell_code), Paragraph("ObjectId | null", table_cell_style), Paragraph("Ref: 'User', Default: null, Indexed", table_cell_style), Paragraph("Associated student who booked the slot.", table_cell_style)],
        [Paragraph("<code>startTime</code>", table_cell_code), Paragraph("Date", table_cell_style), Paragraph("Required, Indexed", table_cell_style), Paragraph("ISO 8601 UTC session start timestamp.", table_cell_style)],
        [Paragraph("<code>endTime</code>", table_cell_code), Paragraph("Date", table_cell_style), Paragraph("Required, Validation: > startTime", table_cell_style), Paragraph("ISO 8601 UTC session completion deadline.", table_cell_style)],
        [Paragraph("<code>status</code>", table_cell_code), Paragraph("String", table_cell_style), Paragraph("Enum: AVAILABLE / BOOKED / COMPLETED", table_cell_style), Paragraph("Default: <b>AVAILABLE</b>. Managed state machine.", table_cell_style)],
        [Paragraph("<code>completedAt</code>", table_cell_code), Paragraph("Date | null", table_cell_style), Paragraph("Default: null", table_cell_style), Paragraph("Timestamp recorded when marked completed via API 5.", table_cell_style)],
        [Paragraph("<code>Compound Index</code>", table_cell_code), Paragraph("Index", table_cell_style), Paragraph("{ startTime: 1, status: 1 }", table_cell_style), Paragraph("Optimizes API 3 aggregation date filtering.", table_cell_style)],
    ]
    t_sess_s = Table(session_schema_data, colWidths=[1.3 * inch, 0.9 * inch, 2.0 * inch, 3.0 * inch])
    t_sess_s.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
    ]))
    story.append(t_sess_s)

    # Page Break -> PAGE 3
    story.append(PageBreak())

    # =========================================================================
    # PAGE 3: MANDATORY REST APIS SPECIFICATION (APIs 1, 2, 3)
    # =========================================================================
    story.append(Paragraph("6. Mandatory REST APIs Implementation & Pipelines (Part 1)", h1_style))

    # API 1
    story.append(Paragraph("<b>API 1 — Create User</b> &nbsp;<code>POST /users</code>", h2_style))
    story.append(Paragraph(
        "<b>Description:</b> Creates a new student/user profile in the system. Ensures email uniqueness at both Mongoose and MongoDB engine levels. "
        "Passwords are auto-hashed with 10 salt rounds.",
        body_style
    ))
    api1_box = [
        [
            Paragraph(
                "<b>Request Headers:</b> <code>Content-Type: application/json</code><br/>"
                "<b>Request Body:</b><br/>"
                "{\n"
                '  "fullName": "Saurabh Agnihotri",\n'
                '  "email": "saurabh.agnihotri@example.com",\n'
                '  "phone": "+919876543210"\n'
                "}<br/>"
                "<b>Status Code:</b> <code>201 Created</code> &nbsp;&nbsp;|&nbsp;&nbsp; "
                "<b>Error Codes:</b> <code>400 Bad Request</code> (Schema validation failure), <code>409 Conflict</code> (Email already registered)",
                code_style
            )
        ]
    ]
    t_api1 = Table(api1_box, colWidths=[7.2 * inch])
    t_api1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), code_bg),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_api1)
    story.append(Spacer(1, 8))

    # API 2
    story.append(Paragraph("<b>API 2 — Create Session</b> &nbsp;<code>POST /sessions</code>", h2_style))
    story.append(Paragraph(
        "<b>Description:</b> Creates a new teaching slot for a designated teacher. Validates that the referenced teacher exists in the database, "
        "that <code>endTime</code> is strictly greater than <code>startTime</code>, and initializes status to <code>AVAILABLE</code>.",
        body_style
    ))
    api2_box = [
        [
            Paragraph(
                "<b>Request Body:</b><br/>"
                "{\n"
                '  "teacherId": "673cf8b1a3e9b14c3e8a1001",\n'
                '  "startTime": "2026-11-20T10:00:00.000Z",\n'
                '  "endTime": "2026-11-20T11:00:00.000Z"\n'
                "}<br/>"
                "<b>Validation Rules:</b> <code>startTime &lt; endTime</code> &nbsp;|&nbsp; <code>Teacher.findById(teacherId) != null</code><br/>"
                "<b>Default Fields:</b> <code>status = 'AVAILABLE'</code>, <code>userId = null</code>, <code>completedAt = null</code><br/>"
                "<b>Status Code:</b> <code>201 Created</code> &nbsp;&nbsp;|&nbsp;&nbsp; <b>Errors:</b> <code>400 Bad Request</code>, <code>404 Not Found</code> (Teacher missing)",
                code_style
            )
        ]
    ]
    t_api2 = Table(api2_box, colWidths=[7.2 * inch])
    t_api2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), code_bg),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_api2)
    story.append(Spacer(1, 8))

    # API 3
    story.append(Paragraph("<b>API 3 — Available Sessions for Booking</b> &nbsp;<code>GET /sessions/available?dateTimestamp={timestamp}</code>", h2_style))
    story.append(Paragraph(
        "<b>Mandatory Requirement:</b> Must be implemented using the <b>MongoDB Aggregation Pipeline</b>. "
        "This endpoint converts the provided epoch millisecond timestamp into start-of-day (00:00:00.000Z) and end-of-day (23:59:59.999Z) boundaries, "
        "filtering only sessions with <code>status: 'AVAILABLE'</code> and joining teacher profile metadata.",
        body_style
    ))
    api3_pipeline = [
        [
            Paragraph(
                "<b>MongoDB Aggregation Pipeline Stages (API 3):</b><br/>"
                "<code>const pipeline = [</code><br/>"
                "&nbsp;&nbsp;<b>// Stage 1: Filter by date boundaries and AVAILABLE status</b><br/>"
                "&nbsp;&nbsp;<code>{ $match: { status: 'AVAILABLE', startTime: { $gte: startOfDay, $lte: endOfDay } } },</code><br/>"
                "&nbsp;&nbsp;<b>// Stage 2: Join Teacher collection to fetch full instructor profile</b><br/>"
                "&nbsp;&nbsp;<code>{ $lookup: { from: 'teachers', localField: 'teacherId', foreignField: '_id', as: 'teacher' } },</code><br/>"
                "&nbsp;&nbsp;<b>// Stage 3: Unwind teacher array into an embedded object</b><br/>"
                "&nbsp;&nbsp;<code>{ $unwind: { path: '$teacher', preserveNullAndEmptyArrays: false } },</code><br/>"
                "&nbsp;&nbsp;<b>// Stage 4: Order chronologically by session start time</b><br/>"
                "&nbsp;&nbsp;<code>{ $sort: { startTime: 1 } },</code><br/>"
                "&nbsp;&nbsp;<b>// Stage 5: Project safe sanitized response payload</b><br/>"
                "&nbsp;&nbsp;<code>{ $project: { _id: 1, startTime: 1, endTime: 1, status: 1, teacher: { _id: 1, fullName: 1, email: 1, specialization: 1, experience: 1 } } }</code><br/>"
                "<code>];</code><br/>"
                "<b>Status Code:</b> <code>200 OK</code> &nbsp;&nbsp;|&nbsp;&nbsp; <b>Response:</b> Returns array of available session objects.",
                code_style
            )
        ]
    ]
    t_api3 = Table(api3_pipeline, colWidths=[7.2 * inch])
    t_api3.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), code_bg),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#2563eb")),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_api3)

    # Page Break -> PAGE 4
    story.append(PageBreak())

    # =========================================================================
    # PAGE 4: MANDATORY REST APIS SPECIFICATION (APIs 4, 5, 6)
    # =========================================================================
    story.append(Paragraph("7. Mandatory REST APIs Implementation & Pipelines (Part 2)", h1_style))

    # API 4
    story.append(Paragraph("<b>API 4 — Book Session</b> &nbsp;<code>POST /sessions/:id/book</code>", h2_style))
    story.append(Paragraph(
        "<b>Description:</b> Reserves an available session for a student. Validates user existence, verifies session availability, "
        "and atomically updates the session status to <code>BOOKED</code> while binding the user's ID. "
        "Guarantees that a booked session cannot be double-booked.",
        body_style
    ))
    api4_box = [
        [
            Paragraph(
                "<b>Request URL Param:</b> <code>:id</code> (Session ObjectId)<br/>"
                "<b>Request Body:</b> <code>{ \"userId\": \"673cf8b1a3e9b14c3e8a2001\" }</code><br/>"
                "<b>Atomic Execution Logic (Concurrency Safe):</b><br/>"
                "<code>const session = await Session.findOneAndUpdate(</code><br/>"
                "&nbsp;&nbsp;<code>{ _id: sessionId, status: 'AVAILABLE' },</code><br/>"
                "&nbsp;&nbsp;<code>{ $set: { status: 'BOOKED', userId: userObjectId } },</code><br/>"
                "&nbsp;&nbsp;<code>{ new: true, runValidators: true }</code><br/>"
                "<code>);</code><br/>"
                "<b>Business Rules Enforced:</b><br/>"
                "• If session does not exist → Throws <code>404 Not Found</code>.<br/>"
                "• If session status is already <code>BOOKED</code> or <code>COMPLETED</code> → Throws <code>400 Bad Request: 'Session is not available for booking'</code>.<br/>"
                "• If user does not exist in DB → Throws <code>404 Not Found: 'User not found'</code>.<br/>"
                "<b>Status Code:</b> <code>200 OK</code> with booked session payload.",
                code_style
            )
        ]
    ]
    t_api4 = Table(api4_box, colWidths=[7.2 * inch])
    t_api4.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), code_bg),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_api4)
    story.append(Spacer(1, 8))

    # API 5
    story.append(Paragraph("<b>API 5 — Mark Session Complete</b> &nbsp;<code>PATCH /sessions/:id/complete</code>", h2_style))
    story.append(Paragraph(
        "<b>Description:</b> Concludes an active booked session. Validates that the session is currently in <code>BOOKED</code> status, "
        "transitions it to <code>COMPLETED</code>, and stamps <code>completedAt</code> with the current UTC timestamp.",
        body_style
    ))
    api5_box = [
        [
            Paragraph(
                "<b>Request URL Param:</b> <code>:id</code> (Session ObjectId)<br/>"
                "<b>Business Rules Enforced:</b><br/>"
                "• Session must exist in database (otherwise <code>404 Not Found</code>).<br/>"
                "• Only <code>BOOKED</code> sessions can be marked complete. If <code>AVAILABLE</code> or already <code>COMPLETED</code>, throws <code>400 Bad Request</code>.<br/>"
                "• Updates: <code>status = 'COMPLETED'</code>, <code>completedAt = new Date()</code>.<br/>"
                "<b>Status Code:</b> <code>200 OK</code> with completed session payload.",
                code_style
            )
        ]
    ]
    t_api5 = Table(api5_box, colWidths=[7.2 * inch])
    t_api5.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), code_bg),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_api5)
    story.append(Spacer(1, 8))

    # API 6
    story.append(Paragraph("<b>API 6 — User Session List</b> &nbsp;<code>GET /users/:id/sessions</code>", h2_style))
    story.append(Paragraph(
        "<b>Mandatory Requirement:</b> Must be implemented using the <b>MongoDB Aggregation Pipeline</b>. "
        "Separates the user's sessions into two distinct arrays (<b>Upcoming Sessions</b> and <b>Completed Sessions</b>) in a single database roundtrip "
        "using the high-performance <b><code>$facet</code></b> aggregation operator.",
        body_style
    ))
    api6_pipeline = [
        [
            Paragraph(
                "<b>MongoDB Aggregation Pipeline Stages (API 6 with $facet):</b><br/>"
                "<code>const pipeline = [</code><br/>"
                "&nbsp;&nbsp;<b>// Stage 1: Match all sessions associated with target user</b><br/>"
                "&nbsp;&nbsp;<code>{ $match: { userId: new Types.ObjectId(userId) } },</code><br/>"
                "&nbsp;&nbsp;<b>// Stage 2: Join teacher information for each session</b><br/>"
                "&nbsp;&nbsp;<code>{ $lookup: { from: 'teachers', localField: 'teacherId', foreignField: '_id', as: 'teacher' } },</code><br/>"
                "&nbsp;&nbsp;<code>{ $unwind: { path: '$teacher', preserveNullAndEmptyArrays: true } },</code><br/>"
                "&nbsp;&nbsp;<b>// Stage 3: Split into Upcoming vs Completed via $facet in 1 query</b><br/>"
                "&nbsp;&nbsp;<code>{ $facet: {</code><br/>"
                "&nbsp;&nbsp;&nbsp;&nbsp;<code>upcomingSessions: [</code><br/>"
                "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<code>{ $match: { status: 'BOOKED' } },</code><br/>"
                "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<code>{ $sort: { startTime: 1 } }</code><br/>"
                "&nbsp;&nbsp;&nbsp;&nbsp;<code>],</code><br/>"
                "&nbsp;&nbsp;&nbsp;&nbsp;<code>completedSessions: [</code><br/>"
                "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<code>{ $match: { status: 'COMPLETED' } },</code><br/>"
                "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<code>{ $sort: { completedAt: -1 } }</code><br/>"
                "&nbsp;&nbsp;&nbsp;&nbsp;<code>]</code><br/>"
                "&nbsp;&nbsp;<code>} }</code><br/>"
                "<code>];</code><br/>"
                "<b>Status Code:</b> <code>200 OK</code> &nbsp;&nbsp;|&nbsp;&nbsp; <b>Response:</b> <code>{ upcomingSessions: [...], completedSessions: [...] }</code>",
                code_style
            )
        ]
    ]
    t_api6 = Table(api6_pipeline, colWidths=[7.2 * inch])
    t_api6.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), code_bg),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#059669")),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_api6)

    # Page Break -> PAGE 5
    story.append(PageBreak())

    # =========================================================================
    # PAGE 5: VISUAL INTERFACE & SOFTWARE DESIGN (SCREENSHOTS)
    # =========================================================================
    story.append(Paragraph("8. Visual Interface & Software Design Verification", h1_style))
    story.append(Paragraph(
        "Below are screenshots captured directly from the live deployed software, showcasing teacher schedule management, "
        "student booking workflows, in-app academic resources, and REST API telemetry.",
        body_style
    ))

    # Screenshot helper
    upload_dir = r"C:\Users\saura\.gemini\antigravity\brain\813f63e6-3f88-4aa8-a780-0686ebeee5e5\.user_uploaded"
    img_teacher_path = os.path.join(upload_dir, "media_1795153810328_b885cb5c.png")
    img_student_path = os.path.join(upload_dir, "media_1795155989282_695029cd.jpg")
    img_portal_path = os.path.join(upload_dir, "media_1795189351346_f9ac3552.png")
    img_api_path = os.path.join(upload_dir, "media_1795169170851_b198bce9.jpg")

    screenshots_grid = []

    # Row 1: Teacher Dashboard & Student Booking
    row1 = []
    if os.path.exists(img_teacher_path):
        row1.append(Image(img_teacher_path, width=3.45 * inch, height=1.9 * inch))
    else:
        row1.append(Paragraph("Teacher Dashboard Screenshot", body_style))

    if os.path.exists(img_student_path):
        row1.append(Image(img_student_path, width=3.45 * inch, height=1.9 * inch))
    else:
        row1.append(Paragraph("Student Booking Screenshot", body_style))

    t_img_row1 = Table([[
        Paragraph("<b>Figure 1: Teacher Portal</b> (Schedule Slots API 2, Mark Complete API 5)", h2_style),
        Paragraph("<b>Figure 2: Student Discovery</b> (Available Sessions API 3 & Book API 4)", h2_style)
    ], row1], colWidths=[3.55 * inch, 3.55 * inch])
    t_img_row1.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
    ]))
    story.append(t_img_row1)
    story.append(Spacer(1, 8))

    # Row 2: In-App Learning Portal & REST API Telemetry
    row2 = []
    if os.path.exists(img_portal_path):
        row2.append(Image(img_portal_path, width=3.45 * inch, height=1.9 * inch))
    else:
        row2.append(Paragraph("Learning Portal Screenshot", body_style))

    if os.path.exists(img_api_path):
        row2.append(Image(img_api_path, width=3.45 * inch, height=1.9 * inch))
    else:
        row2.append(Paragraph("API Telemetry Screenshot", body_style))

    t_img_row2 = Table([[
        Paragraph("<b>Figure 3: Learning Portal</b> (Video/Doc Drag & Drop up to 200MB)", h2_style),
        Paragraph("<b>Figure 4: REST API Execution</b> (Browser DevTools Network Telemetry)", h2_style)
    ], row2], colWidths=[3.55 * inch, 3.55 * inch])
    t_img_row2.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
    ]))
    story.append(t_img_row2)

    # Page Break -> PAGE 6
    story.append(PageBreak())

    # =========================================================================
    # PAGE 6: ENGINEERING RIGOR, SECURITY & COMPLIANCE CHECKLIST
    # =========================================================================
    story.append(Paragraph("9. Centralized Error Handling & Architecture Rigor", h1_style))
    story.append(Paragraph(
        "The application implements an enterprise error handling architecture. Operational exceptions inherit from a custom <code>AppError</code> base class, "
        "allowing controllers and services to bubble errors up with explicit HTTP status codes, operational tags, and detailed validation context.",
        body_style
    ))

    error_box = [
        [
            Paragraph(
                "<b>Centralized Error Middleware Architecture:</b><br/>"
                "• <b>Custom AppError Class:</b> Carries <code>statusCode</code>, <code>isOperational: true</code>, and optional error code metadata.<br/>"
                "• <b>Validation Errors:</b> Zod validation schemas catch malformed payloads at the route boundary before business execution (returns <code>400 Bad Request</code> with field details).<br/>"
                "• <b>MongoDB Duplicate Key Handling:</b> Automatically transforms Mongo code 11000 into <code>409 Conflict: 'Email is already registered'</code>.<br/>"
                "• <b>Async Handler:</b> High-order <code>asyncHandler(fn)</code> wraps every route handler, eliminating boilerplate try/catch blocks and forwarding rejections to global Express error middleware.",
                code_style
            )
        ]
    ]
    t_err = Table(error_box, colWidths=[7.2 * inch])
    t_err.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), code_bg),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_err)
    story.append(Spacer(1, 10))

    story.append(Paragraph("10. Assignment Compliance Verification Checklist", h1_style))
    story.append(Paragraph(
        "The following matrix summarizes strict adherence to every requirement listed in the Backend Developer Assignment brief:",
        body_style
    ))

    checklist_data = [
        [Paragraph("Assignment Requirement", table_header_style), Paragraph("Technology / Mechanism", table_header_style), Paragraph("Compliance Status", table_header_style)],
        [Paragraph("Mandatory Tech Stack", table_cell_style), Paragraph("Node.js, TypeScript 5.7, Express 5.0, MongoDB 8.0, Mongoose 8.9", table_cell_style), Paragraph("<b>100% COMPLIANT</b>", table_cell_style)],
        [Paragraph("API 1: Create User", table_cell_style), Paragraph("<code>POST /users</code> with unique email validation & bcrypt hash", table_cell_style), Paragraph("<b>100% COMPLIANT</b>", table_cell_style)],
        [Paragraph("API 2: Create Session", table_cell_style), Paragraph("<code>POST /sessions</code> with teacher lookup & <code>endTime > startTime</code>", table_cell_style), Paragraph("<b>100% COMPLIANT</b>", table_cell_style)],
        [Paragraph("API 3: Available Sessions", table_cell_style), Paragraph("<code>GET /sessions/available</code> via <b>MongoDB Aggregation Pipeline</b>", table_cell_style), Paragraph("<b>100% COMPLIANT</b>", table_cell_style)],
        [Paragraph("API 4: Book Session", table_cell_style), Paragraph("<code>POST /sessions/:id/book</code> with atomic lock & availability check", table_cell_style), Paragraph("<b>100% COMPLIANT</b>", table_cell_style)],
        [Paragraph("API 5: Mark Complete", table_cell_style), Paragraph("<code>PATCH /sessions/:id/complete</code> checks BOOKED & sets completedAt", table_cell_style), Paragraph("<b>100% COMPLIANT</b>", table_cell_style)],
        [Paragraph("API 6: User Sessions List", table_cell_style), Paragraph("<code>GET /users/:id/sessions</code> via <b>$facet Aggregation Pipeline</b>", table_cell_style), Paragraph("<b>100% COMPLIANT</b>", table_cell_style)],
        [Paragraph("Centralized Error Handling", table_cell_style), Paragraph("<code>AppError</code> + Global Express Error Middleware", table_cell_style), Paragraph("<b>100% COMPLIANT</b>", table_cell_style)],
        [Paragraph("Async / Await Only", table_cell_style), Paragraph("Zero callback chains; 100% native async/await throughout", table_cell_style), Paragraph("<b>100% COMPLIANT</b>", table_cell_style)],
        [Paragraph("Environment Variables", table_cell_style), Paragraph("Configured via <code>.env</code> with typed <code>src/config/env.ts</code>", table_cell_style), Paragraph("<b>100% COMPLIANT</b>", table_cell_style)],
        [Paragraph("Postman Test Collection", table_cell_style), Paragraph("Submitted in repo as <code>backend/postman_collection.json</code>", table_cell_style), Paragraph("<b>100% COMPLIANT</b>", table_cell_style)],
        [Paragraph("Live Cloud Deployments", table_cell_style), Paragraph("Render (Backend API) & Vercel (Interactive Frontend)", table_cell_style), Paragraph("<b>LIVE & VERIFIED</b>", table_cell_style)],
    ]
    t_check = Table(checklist_data, colWidths=[2.1 * inch, 3.7 * inch, 1.4 * inch])
    t_check.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ('TEXTCOLOR', (2, 1), (2, -1), accent_green),
    ]))
    story.append(t_check)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated {filename}")

if __name__ == "__main__":
    out_pdf = "c:/Users/saura/Desktop/Backend-Assgnment/Backend_Developer_Assignment_Documentation.pdf"
    create_documentation_pdf(out_pdf)

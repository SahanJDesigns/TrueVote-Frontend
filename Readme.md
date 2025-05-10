
 
# Backend Setup Guide

This guide will help you set up the backend environment for the project.

---

## ✅ Prerequisites

Before proceeding, make sure you have the following installed on your system:

### 1. **Visual Studio Code**
- Download: [https://code.visualstudio.com/](https://code.visualstudio.com/)

### 2. **CMake**
- Download: [https://cmake.org/download/](https://cmake.org/download/)

---

## 🔑 Required Environment Variables

Fill in the following keys in your environment (e.g., `.env` file or environment variables manager of your OS):

### **MySQL Database**
```env
DB_USER=<your_db_username>
DB_PASSWORD=<your_db_password>
DB_HOST=<your_db_host>
DB_PORT=<your_db_port>
DB_NAME=<your_db_name>
```

### **AWS Credentials**
```env
AWS_ACCESS_KEY_ID=<your_aws_access_key>
AWS_SECRET_ACCESS_KEY=<your_aws_secret_key>
AWS_REGION=<your_aws_region>
S3_BUCKET_NAME=<your_s3_bucket_name>
```

### **RECAPTCHA**
```env
RECAPTCHA_SECRET_KEY=<your_secret_key>
```

---

## 📦 Install Required Python Packages

Make sure you have Python and `pip` installed.

Then install dependencies from `requirements.txt`:

```bash
pip install -r requirements.txt
```

---

## 🚀 Start FastAPI Server

After setting up everything, run the following command to start the FastAPI endpoint:

```bash
uvicorn app.main:app --reload 
```


## 📚 Additional Resources

- **FastAPI Docs**: [https://fastapi.tiangolo.com/](https://fastapi.tiangolo.com/)
- **MySQL Docs**: [https://dev.mysql.com/doc/](https://dev.mysql.com/doc/)
- **AWS S3 Docs**: [https://docs.aws.amazon.com/s3/index.html](https://docs.aws.amazon.com/s3/index.html)

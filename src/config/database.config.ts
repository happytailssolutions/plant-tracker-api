export const databaseConfig = {
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres.ogwseyxqslprfeuwhols:UYJ3gpf9gvw.xva.gkb@aws-0-us-west-1.pooler.supabase.com:5432/postgres",
  SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET || "xupQOQoUyVN0QazJQlprtxP+DFZmbmSKacJE+y64/yyOACI0xm30PiTCuXc5aCzuvWIooLVeNn47xZXjdr/aww==",
  NODE_ENV: process.env.NODE_ENV || "production"
};

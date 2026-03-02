ALTER TABLE "invoices" ADD COLUMN "shipping_address" varchar(255);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "shipping_zip_code" varchar(20);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "shipping_city" varchar(100);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "shipping_country" varchar(100);
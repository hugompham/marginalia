.PHONY: dev dev-native stop clean setup logs

dev: ## Start full stack (Docker + Supabase)
	supabase start && \
	supabase functions serve & \
	FUNC_PID=$$!; \
	trap 'kill $$FUNC_PID 2>/dev/null; docker compose -f docker-compose.dev.yml down' EXIT; \
	docker compose -f docker-compose.dev.yml up --build

dev-native: ## Start full stack (native + Supabase)
	supabase start && \
	supabase functions serve & \
	FUNC_PID=$$!; \
	trap 'kill $$FUNC_PID 2>/dev/null' EXIT; \
	pnpm dev

stop: ## Stop all services
	docker compose -f docker-compose.dev.yml down
	supabase stop

clean: ## Stop + remove volumes + reset Supabase (DESTRUCTIVE)
	@echo "This will destroy all local data (Docker volumes + Supabase). Continue? [y/N]" && \
	read ans && [ "$$ans" = "y" ] || (echo "Aborted." && exit 1)
	docker compose -f docker-compose.dev.yml down -v
	supabase stop --no-backup

setup: ## Fresh install
	pnpm install
	supabase start
	pnpm db:types

logs: ## Tail Docker logs
	docker compose -f docker-compose.dev.yml logs -f

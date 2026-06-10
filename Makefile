.PHONY: make clean dist force toggleall dark nodark mini nomini

make:
	@bash make.sh -$(MAKEFLAGS)
clean:
	@bash make.sh clean
dist:
	@bash make.sh dist
force:
	@bash make.sh -B

mini:   ; @rm -f .nominify; echo 'enabling minifications...';  bash make.sh -f
nomini: ; @touch .nominify; echo 'disabling minifications...'; bash make.sh -f
dark:   ; @touch .keepdark; echo 'enabling darkmode...';       bash make.sh -f
nodark: ; @rm -f .keepdark; echo 'disabling darkmode...';      bash make.sh -f

toggleall:
ifneq ($(wildcard .nominify),)
	@rm -f .nominify .keepdark
	@echo 'enabling minifications and disabling darkmode...'
else
	@touch .nominify .keepdark
	@echo 'disabling minifications and enabling darkmode...'
endif
	@bash make.sh -f



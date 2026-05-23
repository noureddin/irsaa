.PHONY: make clean dist

make:
	@bash make.sh -$(MAKEFLAGS)
clean:
	@bash make.sh clean
dist:
	@bash make.sh dist



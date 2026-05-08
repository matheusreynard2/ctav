package com.ctav.api.controller;

import com.ctav.api.dto.RemedioRequestDTO;
import com.ctav.api.dto.RemedioResponseDTO;
import com.ctav.api.service.RemedioService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/remedios")
@RequiredArgsConstructor
public class RemedioController {

    private final RemedioService remedioService;

    @PostMapping
    public ResponseEntity<RemedioResponseDTO> criar(@Valid @RequestBody RemedioRequestDTO dto) {
        RemedioResponseDTO criado = remedioService.criar(dto);
        return ResponseEntity.ok().body(criado);
    }

    @GetMapping
    public ResponseEntity<List<RemedioResponseDTO>> listar() {
        return ResponseEntity.ok(remedioService.listar());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RemedioResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(remedioService.buscarPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RemedioResponseDTO> atualizar(
            @PathVariable Long id,
            @Valid @RequestBody RemedioRequestDTO dto) {
        return ResponseEntity.ok(remedioService.atualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        remedioService.deletar(id);
        return ResponseEntity.noContent().build();
    }
}

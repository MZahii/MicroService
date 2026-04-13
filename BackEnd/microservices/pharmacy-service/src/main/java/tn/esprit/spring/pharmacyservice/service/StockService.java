package tn.esprit.spring.pharmacyservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import tn.esprit.spring.pharmacyservice.dto.DispenseRequestDTO;
import tn.esprit.spring.pharmacyservice.dto.DispensationLogDTO;
import tn.esprit.spring.pharmacyservice.dto.StockDTO;
import tn.esprit.spring.pharmacyservice.dto.TransferStockRequestDTO;
import tn.esprit.spring.pharmacyservice.dto.TransferStockResponseDTO;
import tn.esprit.spring.pharmacyservice.entity.Batch;
import tn.esprit.spring.pharmacyservice.entity.DispensationLog;
import tn.esprit.spring.pharmacyservice.entity.Stock;
import tn.esprit.spring.pharmacyservice.repository.BatchRepository;
import tn.esprit.spring.pharmacyservice.repository.DispensationLogRepository;
import tn.esprit.spring.pharmacyservice.repository.StockRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class StockService {

    private final StockRepository stockRepository;
    private final BatchRepository batchRepository;
    private final DispensationLogRepository dispensationLogRepository;

    // ─── Initialization ───────────────────────────────────────────────────────

    /**
     * Called when a Batch is first created to initialise its stock entry.
     */
    public StockDTO initializeStock(Long batchId, int initialQty) {
        if (stockRepository.findByBatchId(batchId).isPresent()) {
            throw new IllegalStateException("Stock already exists for batch: " + batchId);
        }
        Stock stock = Stock.builder()
                .batchId(batchId)
                .quantityAvailable(initialQty)
                .build();
        return toDTO(stockRepository.save(stock));
    }

    // ─── Reads ────────────────────────────────────────────────────────────────

    public StockDTO getStockByBatch(Long batchId) {
        return toDTO(findByBatchId(batchId));
    }

    public List<StockDTO> getAllStock() {
        return stockRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<StockDTO> getLowStock(int threshold) {
        return stockRepository.findLowStock(threshold).stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    public List<StockDTO> getOutOfStock() {
        return stockRepository.findOutOfStock().stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    // ─── Mutations ────────────────────────────────────────────────────────────

    /**
     * Increase stock when a supply order is delivered.
     */
    public StockDTO receiveDelivery(Long batchId, int qty) {
        Stock stock = findByBatchId(batchId);
        stock.updateStock(qty);
        log.info("Stock updated for batch {}: +{} units. New total: {}", batchId, qty, stock.getQuantityAvailable());
        return toDTO(stockRepository.save(stock));
    }

    /**
     * Dispense medication (decrease stock).
     */
    public StockDTO dispense(DispenseRequestDTO request) {
        Long batchId = request.getBatchId();
        int qty = request.getQuantity();

        // Guard: expired batch check
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new NoSuchElementException("Batch not found: " + batchId));
        if (batch.isExpired()) {
            throw new IllegalStateException("Cannot dispense from expired batch: " + batchId);
        }

        Stock stock = findByBatchId(batchId);
        if (!stock.checkAvailability(qty)) {
            throw new IllegalStateException(
                    "Insufficient stock for batch " + batchId + ". Requested: " + qty
                            + ", Available: " + stock.getQuantityAvailable());
        }

        stock.updateStock(-qty);
        log.info("Dispensed {} units from batch {} for patient {}",
                qty, batchId); //, request.getPatientId()  put it in
        StockDTO result = toDTO(stockRepository.save(stock));

        dispensationLogRepository.save(DispensationLog.builder()
                .batchId(batchId)
                .quantity(qty)
                .dispensedAt(LocalDateTime.now())
                .build());

        return result;
    }

    /**
     * Manual adjustment (positive or negative).
     */
    public StockDTO adjustStock(Long batchId, int delta, String reason) {
        Stock stock = findByBatchId(batchId);
        stock.updateStock(delta);
        log.info("Manual stock adjustment for batch {}: {} (reason: {})", batchId, delta, reason);
        return toDTO(stockRepository.save(stock));
    }

    /**
     * Transfer stock between two batches of the same medication.
     */
    public TransferStockResponseDTO transferStock(TransferStockRequestDTO request) {
        Long sourceBatchId = request.getSourceBatchId();
        Long targetBatchId = request.getTargetBatchId();
        int qty = request.getQuantity() != null ? request.getQuantity() : 0;
        String reason = request.getReason() != null ? request.getReason().trim() : "stock transfer";

        if (sourceBatchId == null || targetBatchId == null) {
            throw new IllegalArgumentException("Source batch and target batch are required.");
        }
        if (sourceBatchId.equals(targetBatchId)) {
            throw new IllegalArgumentException("Source and target batches must be different.");
        }
        if (qty <= 0) {
            throw new IllegalArgumentException("Transfer quantity must be greater than 0.");
        }

        Batch sourceBatch = batchRepository.findById(sourceBatchId)
                .orElseThrow(() -> new NoSuchElementException("Source batch not found: " + sourceBatchId));
        Batch targetBatch = batchRepository.findById(targetBatchId)
                .orElseThrow(() -> new NoSuchElementException("Target batch not found: " + targetBatchId));

        if (!sourceBatch.getMedication().getMedicationId().equals(targetBatch.getMedication().getMedicationId())) {
            throw new IllegalStateException("Stock transfer is only allowed between batches of the same medication.");
        }
        if (sourceBatch.isExpired()) {
            throw new IllegalStateException("Cannot transfer stock from an expired source batch.");
        }
        if (targetBatch.isExpired()) {
            throw new IllegalStateException("Cannot transfer stock into an expired target batch.");
        }

        Stock sourceStock = findByBatchId(sourceBatchId);
        if (!sourceStock.checkAvailability(qty)) {
            throw new IllegalStateException(
                    "Insufficient stock on source batch " + sourceBatchId + ". Requested: " + qty
                            + ", Available: " + sourceStock.getQuantityAvailable());
        }

        Stock targetStock = stockRepository.findByBatchId(targetBatchId)
                .orElseGet(() -> stockRepository.save(
                        Stock.builder()
                                .batchId(targetBatchId)
                                .quantityAvailable(0)
                                .build()
                ));

        sourceStock.updateStock(-qty);
        targetStock.updateStock(qty);

        Stock savedSource = stockRepository.save(sourceStock);
        Stock savedTarget = stockRepository.save(targetStock);

        log.info("Transferred {} units from batch {} to batch {} (reason: {})",
                qty, sourceBatchId, targetBatchId, reason);

        return TransferStockResponseDTO.builder()
                .sourceBatchId(sourceBatchId)
                .targetBatchId(targetBatchId)
                .quantityTransferred(qty)
                .sourceQuantityAvailable(savedSource.getQuantityAvailable())
                .targetQuantityAvailable(savedTarget.getQuantityAvailable())
                .reason(reason)
                .build();
    }

    // ─── Dispensation History ─────────────────────────────────────────────────

    public List<DispensationLogDTO> getDispensationHistory(LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end   = date.atTime(23, 59, 59);
        return dispensationLogRepository
                .findByDispensedAtBetweenOrderByDispensedAtDesc(start, end)
                .stream().map(this::toLogDTO).collect(Collectors.toList());
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private Stock findByBatchId(Long batchId) {
        return stockRepository.findByBatchId(batchId)
                .orElseThrow(() -> new NoSuchElementException("No stock entry for batch: " + batchId));
    }

    private StockDTO toDTO(Stock s) {
        return StockDTO.builder()
                .stockId(s.getStockId())
                .batchId(s.getBatchId())
                .quantityAvailable(s.getQuantityAvailable())
                .build();
    }

    private DispensationLogDTO toLogDTO(DispensationLog l) {
        return DispensationLogDTO.builder()
                .id(l.getId())
                .batchId(l.getBatchId())
                .quantity(l.getQuantity())
                .dispensedAt(l.getDispensedAt())
                .build();
    }
}

package tn.esprit.spring.pharmacyservice.service;

import lombok.RequiredArgsConstructor;
import tn.esprit.spring.pharmacyservice.dto.SupplierDTO;
import tn.esprit.spring.pharmacyservice.dto.SupplyOrderDTO;
import tn.esprit.spring.pharmacyservice.entity.Supplier;
import tn.esprit.spring.pharmacyservice.entity.SupplyOrder;
import tn.esprit.spring.pharmacyservice.event.publisher.OrderDeliveredEvent;
import tn.esprit.spring.pharmacyservice.repository.SupplierRepository;
import tn.esprit.spring.pharmacyservice.repository.SupplyOrderRepository;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final SupplyOrderRepository supplyOrderRepository;
    private final ApplicationEventPublisher eventPublisher;

    // ─── Supplier ─────────────────────────────────────────────────────────────

    public SupplierDTO createSupplier(SupplierDTO dto) {
        Supplier s = Supplier.builder()
                .name(dto.getName())
                .contactInfo(dto.getContactInfo())
                .build();
        return toSupplierDTO(supplierRepository.save(s));
    }

    public List<SupplierDTO> getAllSuppliers() {
        return supplierRepository.findAll().stream()
                .map(this::toSupplierDTO)
                .collect(Collectors.toList());
    }

    public SupplierDTO getSupplier(Long id) {
        return toSupplierDTO(findSupplierById(id));
    }

    public SupplierDTO updateSupplier(Long id, SupplierDTO dto) {
        Supplier s = findSupplierById(id);
        s.setName(dto.getName());
        s.setContactInfo(dto.getContactInfo());
        return toSupplierDTO(supplierRepository.save(s));
    }

    public void deleteSupplier(Long id) {
        supplierRepository.deleteById(id);
    }

    // ─── SupplyOrder ──────────────────────────────────────────────────────────

    public SupplyOrderDTO placeOrder(Long supplierId, SupplyOrderDTO dto) {
        Supplier supplier = findSupplierById(supplierId);
        SupplyOrder order = SupplyOrder.builder()
                .supplier(supplier)
                .medicationId(dto.getMedicationId())
                .orderedQuantity(dto.getOrderedQuantity())
                .orderDate(LocalDate.now())
                .status(SupplyOrder.OrderStatus.PENDING)
                .build();
        return toOrderDTO(supplyOrderRepository.save(order));
    }

    public SupplyOrderDTO markDelivered(Long orderId) {
        SupplyOrder order = findOrderById(orderId);
        order.setStatus(SupplyOrder.OrderStatus.DELIVERED);
        SupplyOrder saved = supplyOrderRepository.save(order);
        // Fire event so StockService can update stock
        eventPublisher.publishEvent(new OrderDeliveredEvent(
                saved.getOrderId(), saved.getMedicationId(), saved.getOrderedQuantity()));
        return toOrderDTO(saved);
    }

    public SupplyOrderDTO cancelOrder(Long orderId) {
        SupplyOrder order = findOrderById(orderId);
        order.cancelOrder();
        return toOrderDTO(supplyOrderRepository.save(order));
    }

    public List<SupplyOrderDTO> getOrdersForSupplier(Long supplierId) {
        return supplyOrderRepository.findBySupplierSupplierId(supplierId).stream()
                .map(this::toOrderDTO)
                .collect(Collectors.toList());
    }

    public List<SupplyOrderDTO> getOrdersByStatus(String status) {
        return supplyOrderRepository.findByStatus(SupplyOrder.OrderStatus.valueOf(status.toUpperCase()))
                .stream().map(this::toOrderDTO).collect(Collectors.toList());
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private Supplier findSupplierById(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Supplier not found: " + id));
    }

    private SupplyOrder findOrderById(Long id) {
        return supplyOrderRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("SupplyOrder not found: " + id));
    }

    private SupplierDTO toSupplierDTO(Supplier s) {
        return SupplierDTO.builder()
                .supplierId(s.getSupplierId())
                .name(s.getName())
                .contactInfo(s.getContactInfo())
                .build();
    }

    private SupplyOrderDTO toOrderDTO(SupplyOrder o) {
        return SupplyOrderDTO.builder()
                .orderId(o.getOrderId())
                .supplierId(o.getSupplier().getSupplierId())
                .medicationId(o.getMedicationId())
                .orderDate(o.getOrderDate())
                .status(o.getStatus().name())
                .orderedQuantity(o.getOrderedQuantity())
                .build();
    }
}

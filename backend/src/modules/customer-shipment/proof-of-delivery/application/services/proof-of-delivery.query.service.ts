import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AuthorizationFacade,
  Authorize,
} from '../../../../../packages/authorization';
import { Policy } from '../../../../../packages/authorization/policy';
import { PodPolicy } from '../../domain/authorization/policies/pod.policy';
import { PodAction } from '../../domain/authorization/actions/pod.action';
import { ProofOfDeliveryQueryRepository } from '../../infrastructure/repositories/proof-of-delivery.query.repository';
import { PodVisibilityScope } from '../../domain/authorization/scopes/pod-visibility.scope';
import { ProofOfDeliveryResponseDto } from '../dtos/responses/proof-of-delivery.response.dto';
import { ProofOfDeliveryMapper } from '../mappers/proof-of-delivery.mapper';

@Injectable()
export class ProofOfDeliveryQueryService {
  constructor(
    private readonly queryRepository: ProofOfDeliveryQueryRepository,
    private readonly authorizationFacade: AuthorizationFacade,
    private readonly mapper: ProofOfDeliveryMapper,
  ) {}

  @Authorize({
    policy: Policy(PodPolicy, PodAction.View),
    payloadResolver: (parcelId: string) => ({ parcelId }),
  })
  async findByParcelId(parcelId: string): Promise<ProofOfDeliveryResponseDto> {
    const record = await this.queryRepository.findByParcelId(parcelId);

    if (!record) {
      throw new NotFoundException('Proof of delivery not found');
    }

    const scope = this.authorizationFacade.buildScope({
      builder: PodVisibilityScope,
    });

    // Not-found rather than forbidden, so the endpoint never confirms that a
    // proof exists for another tenant or another customer.
    if (scope.pod?.tenant_id && record.tenant_id !== scope.pod.tenant_id) {
      throw new NotFoundException('Proof of delivery not found');
    }

    if (
      scope.shipment?.sender_customer_profile_id &&
      record.sender_customer_profile_id !==
        scope.shipment.sender_customer_profile_id
    ) {
      throw new NotFoundException('Proof of delivery not found');
    }

    return this.mapper.toResponse(record);
  }
}
